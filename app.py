import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import json
import os

# Page configuration
st.set_page_config(
    page_title="Transformer Gas Analysis",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- DGA Table Thresholds (extracted from images) ---
# Table 1: All Gases < Table 1 for Status 1
DGA_TABLE_1 = {
    'H2': {
        '<=0.2': [80, 75, 100, 100], '>0.2': [40, 40, 40, 40]
    },
    'CH4': {
        '<=0.2': [90, 45, 90, 110], '>0.2': [20, 20, 20, 20]
    },
    'C2H6': {
        '<=0.2': [90, 30, 90, 150], '>0.2': [15, 15, 15, 15]
    },
    'C2H4': {
        '<=0.2': [50, 20, 50, 90], '>0.2': [50, 25, 25, 60]
    },
    'C2H2': {
        '<=0.2': [1, 1, 1, 1], '>0.2': [2, 2, 2, 2]
    },
    'CO': {
        '<=0.2': [900, 900, 900, 900], '>0.2': [500, 500, 500, 500]
    },
    'CO2': {
        '<=0.2': [9000, 5000, 10000, 10000], '>0.2': [5000, 3500, 5500, 5500]
    },
}
# Table 2: Any Gas > Table 2 for Status 2
DGA_TABLE_2 = {
    'H2': {'<=0.2': [200, 200, 200, 200], '>0.2': [90, 90, 90, 90]},
    'CH4': {'<=0.2': [150, 100, 150, 200], '>0.2': [50, 60, 60, 30]},
    'C2H6': {'<=0.2': [175, 70, 175, 250], '>0.2': [40, 40, 40, 40]},
    'C2H4': {'<=0.2': [100, 40, 95, 175], '>0.2': [100, 80, 125, 125]},
    'C2H2': {'<=0.2': [2, 2, 2, 4], '>0.2': [7, 7, 7, 7]},
    'CO': {'<=0.2': [1100, 1100, 1100, 1100], '>0.2': [600, 600, 600, 600]},
    'CO2': {'<=0.2': [12500, 7000, 14000, 14000], '>0.2': [7000, 5000, 8000, 8000]},
}
# Table 3: All Deltas < Table 3 for Status 1
DGA_TABLE_3 = {
    'H2': {'<=0.2': 40, '>0.2': 25},
    'CH4': {'<=0.2': 30, '>0.2': 10},
    'C2H6': {'<=0.2': 25, '>0.2': 7},
    'C2H4': {'<=0.2': 20, '>0.2': 20},
    'C2H2': {'<=0.2': 'Any Increase', '>0.2': 'Any Increase'},
    'CO': {'<=0.2': 250, '>0.2': 175},
    'CO2': {'<=0.2': 2500, '>0.2': 1750},
}
# Table 4: All Rates < Table 4 for Status 1, Any Rates > Table 4 for Status 2
DGA_TABLE_4 = {
    'H2': {'<=0.2': 40, '>0.2': 25},
    'CH4': {'<=0.2': 30, '>0.2': 10},
    'C2H6': {'<=0.2': 25, '>0.2': 7},
    'C2H4': {'<=0.2': 20, '>0.2': 20},
    'C2H2': {'<=0.2': 'Any Increase', '>0.2': 'Any Increase'},
    'CO': {'<=0.2': 250, '>0.2': 175},
    'CO2': {'<=0.2': 2500, '>0.2': 1750},
}

def get_o2_n2_key(o2_n2_ratio):
    return '<=0.2' if o2_n2_ratio <= 0.2 else '>0.2'

def get_o2_n2_key_from_conc(o2, n2):
    if o2 and n2 and n2 > 0:
        ratio = o2 / n2
        return '<=0.2' if ratio <= 0.2 else '>0.2', ratio
    else:
        return '>0.2', None

def dga_status_logic(initial, final, period_days, transformer_age_months):
    o2n2_key, o2n2_ratio = get_o2_n2_key_from_conc(initial.get('O2', 0), initial.get('N2', 0))
    if not transformer_age_months or transformer_age_months == 0:
        age_idx = 0  # Unknown
    else:
        age_years = transformer_age_months / 12
        if age_years < 1:
            age_idx = 0
        elif 1 <= age_years <= 9:
            age_idx = 1
        elif 10 <= age_years <= 30:
            age_idx = 2
        else:
            age_idx = 3
    table_results = {gas: {} for gas in ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2', 'CO', 'CO2']}
    if not period_days or period_days == 0:
        for gas in table_results:
            table_results[gas]['Table 1'] = initial[gas] < DGA_TABLE_1[gas][o2n2_key][age_idx]
            table_results[gas]['Table 2'] = initial[gas] > DGA_TABLE_2[gas][o2n2_key][age_idx]
            table_results[gas]['Table 3'] = 'N/A'
            table_results[gas]['Table 4'] = 'N/A'
        all_gases_ok = all(table_results[gas]['Table 1'] for gas in table_results)
        if all_gases_ok:
            return 1, 'DGA Status 1: Continue Routine DGA and Normal Transformer Operation.', table_results
        any_gas_high = any(table_results[gas]['Table 2'] for gas in table_results)
        if any_gas_high:
            return 3, 'DGA Status 3: Perform Fault Identification and Transformer assessment. Take appropriate action based on assessment results and company policy.', table_results
        return 2, 'DGA Status 2: Increased Transformer Surveillance and DGA Frequency.', table_results
    period_years = period_days / 365.0
    deltas = {}
    rates = {}
    for gas in table_results:
        deltas[gas] = final[gas] - initial[gas]
        rates[gas] = deltas[gas] / period_years if period_years > 0 else 0
        table_results[gas]['Table 1'] = initial[gas] < DGA_TABLE_1[gas][o2n2_key][age_idx] and final[gas] < DGA_TABLE_1[gas][o2n2_key][age_idx]
        table_results[gas]['Table 2'] = initial[gas] > DGA_TABLE_2[gas][o2n2_key][age_idx] or final[gas] > DGA_TABLE_2[gas][o2n2_key][age_idx]
        table_results[gas]['Table 3'] = (deltas[gas] < DGA_TABLE_3[gas][o2n2_key] if isinstance(DGA_TABLE_3[gas][o2n2_key], (int, float)) else deltas[gas] <= 0)
        table_results[gas]['Table 4'] = (rates[gas] < DGA_TABLE_4[gas][o2n2_key] if isinstance(DGA_TABLE_4[gas][o2n2_key], (int, float)) else rates[gas] <= 0)
    all_gases_ok = all(table_results[gas]['Table 1'] for gas in table_results)
    all_deltas_ok = all(table_results[gas]['Table 3'] for gas in table_results)
    all_rates_ok = all(table_results[gas]['Table 4'] for gas in table_results)
    if all_gases_ok and all_deltas_ok and all_rates_ok:
        return 1, 'DGA Status 1: Continue Routine DGA and Normal Transformer Operation.', table_results
    any_gas_high = any(table_results[gas]['Table 2'] for gas in table_results)
    any_rate_high = any(not table_results[gas]['Table 4'] for gas in table_results)
    if any_gas_high or any_rate_high:
        return 3, 'DGA Status 3: Perform Fault Identification and Transformer assessment. Take appropriate action based on assessment results and company policy.', table_results
    return 2, 'DGA Status 2: Increased Transformer Surveillance and DGA Frequency.', table_results

def main():
    # Main header
    st.markdown('<h1 class="main-header">⚡ Transformer Gas Analysis System</h1>', unsafe_allow_html=True)
    
    # Initialize session state
    if 'data_submitted' not in st.session_state:
        st.session_state.data_submitted = False
    if 'transformer_data' not in st.session_state:
        st.session_state.transformer_data = {}
    
    # Sidebar for navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.radio(
        "Select Page",
        ["Data Entry", "View Results", "Export Data"]
    )
    
    if page == "Data Entry":
        data_entry_page()
    elif page == "View Results":
        view_results_page()
    elif page == "Export Data":
        export_data_page()

def data_entry_page():
    st.markdown('<h2 class="section-header">📊 Transformer Information</h2>', unsafe_allow_html=True)
    
    # Basic transformer information
    col1, col2, col3 = st.columns(3)
    
    with col1:
        time_period = st.number_input(
            "Time Period (days)",
            min_value=0,
            max_value=3650,
            value=30,
            help="Duration between initial and final measurements in days"
        )
    
    with col2:
        num_samples = st.number_input(
            "Number of Samples",
            min_value=1,
            max_value=100,
            value=5,
            help="Number of samples taken during the period"
        )
    
    with col3:
        transformer_age = st.number_input(
            "Transformer Age (months)",
            min_value=0,
            max_value=600,
            value=None,
            help="Age of the transformer in months (leave blank if unknown)"
        )
    
    st.markdown('<h2 class="section-header">🔬 Gas Analysis Data</h2>', unsafe_allow_html=True)
    
    # Gas names and their chemical formulas
    gases = {
        'H2': 'Hydrogen',
        'CO2': 'Carbon Dioxide', 
        'CO': 'Carbon Monoxide',
        'C2H4': 'Ethylene',
        'C2H6': 'Ethane',
        'CH4': 'Methane',
        'C2H2': 'Acetylene'
    }
    
    # Create tabs for initial and final periods
    tab1, tab2 = st.tabs(["📈 Initial Period Data", "📉 Final Period Data"])
    
    with tab1:
        st.markdown('<h3 style="color: #27ae60;">Initial Period Gas Concentrations (μL/L)</h3>', unsafe_allow_html=True)
        initial_data = {}
        
        # O2 and N2 concentration input for initial period
        initial_o2 = st.number_input(
            "O2 (Oxygen) Concentration (μL/L)",
            min_value=0.0,
            max_value=100000.0,
            step=0.1,
            help="Initial concentration of Oxygen in μL/L"
        )
        initial_n2 = st.number_input(
            "N2 (Nitrogen) Concentration (μL/L)",
            min_value=0.0,
            max_value=100000.0,
            step=0.1,
            help="Initial concentration of Nitrogen in μL/L"
        )
        initial_data['O2'] = initial_o2
        initial_data['N2'] = initial_n2
        
        # Create a 2-column layout for gas inputs
        col1, col2 = st.columns(2)
        
        for i, (formula, name) in enumerate(gases.items()):
            with col1 if i < 4 else col2:
                with st.container():
                    st.markdown(f'<div class="gas-input">', unsafe_allow_html=True)
                    max_val = 100000.0 if formula == 'CO2' else 10000.0
                    value = st.number_input(
                        f"{formula} ({name})",
                        min_value=0.0,
                        max_value=float(max_val),
                        value=0.0,
                        step=0.1,
                        key=f"initial_{formula}",
                        help=f"Initial concentration of {name} in μL/L"
                    )
                    initial_data[formula] = value
                    st.markdown('</div>', unsafe_allow_html=True)
    
    with tab2:
        st.markdown('<h3 style="color: #e74c3c;">Final Period Gas Concentrations (μL/L)</h3>', unsafe_allow_html=True)
        final_data = {}
        
        # O2 and N2 concentration input for final period
        final_o2 = st.number_input(
            "O2 (Oxygen) Concentration (μL/L)",
            min_value=0.0,
            max_value=100000.0,
            step=0.1,
            help="Final concentration of Oxygen in μL/L"
        )
        final_n2 = st.number_input(
            "N2 (Nitrogen) Concentration (μL/L)",
            min_value=0.0,
            max_value=100000.0,
            step=0.1,
            help="Final concentration of Nitrogen in μL/L"
        )
        final_data['O2'] = final_o2
        final_data['N2'] = final_n2
        
        # Create a 2-column layout for gas inputs
        col1, col2 = st.columns(2)
        
        for i, (formula, name) in enumerate(gases.items()):
            with col1 if i < 4 else col2:
                with st.container():
                    st.markdown(f'<div class="gas-input">', unsafe_allow_html=True)
                    max_val = 100000.0 if formula == 'CO2' else 10000.0
                    value = st.number_input(
                        f"{formula} ({name})",
                        min_value=0.0,
                        max_value=float(max_val),
                        value=0.0,
                        step=0.1,
                        key=f"final_{formula}",
                        help=f"Final concentration of {name} in μL/L"
                    )
                    final_data[formula] = value
                    st.markdown('</div>', unsafe_allow_html=True)
    
    # Submit button
    st.markdown('<h2 class="section-header">💾 Save Data</h2>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if st.button("📊 Submit and Analyze Data", use_container_width=True):
            # Store data in session state
            st.session_state.transformer_data = {
                'time_period': time_period,
                'num_samples': num_samples,
                'transformer_age': transformer_age,
                'initial_data': initial_data,
                'final_data': final_data,
                'timestamp': datetime.now().isoformat()
            }
            st.session_state.data_submitted = True
            
            # Save to file
            save_data_to_file(st.session_state.transformer_data)
            
            st.success("✅ Data submitted successfully! Navigate to 'View Results' to see the analysis.")
            st.balloons()

def view_results_page():
    st.markdown('<h2 class="section-header">📊 Analysis Results</h2>', unsafe_allow_html=True)
    
    if not st.session_state.data_submitted or not st.session_state.transformer_data:
        st.warning("⚠️ No data available. Please submit data in the 'Data Entry' page first.")
        return
    
    data = st.session_state.transformer_data
    
    # Display basic information
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Time Period", f"{data['time_period']} days")
    with col2:
        st.metric("Number of Samples", data['num_samples'])
    with col3:
        st.metric("Transformer Age", f"{data['transformer_age']} months")
    
    # DGA Status Interpretation
    status, interpretation, table_results = dga_status_logic(
        data['initial_data'],
        data['final_data'],
        data['time_period'],
        data['transformer_age']
    )
    st.markdown(f'<h3 style="color: #2c3e50;">DGA Status Interpretation</h3>', unsafe_allow_html=True)
    st.info(interpretation)
    
    # Show which tables were satisfied for each gas
    st.markdown('<h3 style="color: #2c3e50;">Table Condition Results</h3>', unsafe_allow_html=True)
    table_summary = []
    for gas, results in table_results.items():
        table_summary.append({
            'Gas': gas,
            'Table 1': 'Yes' if results['Table 1'] else 'No',
            'Table 2': 'Yes' if results['Table 2'] else 'No',
            'Table 3': 'Yes' if results['Table 3'] == True else ('No' if results['Table 3'] == False else 'N/A'),
            'Table 4': 'Yes' if results['Table 4'] == True else ('No' if results['Table 4'] == False else 'N/A'),
        })
    st.dataframe(pd.DataFrame(table_summary), use_container_width=True)
    
    # Show table with initial, final, delta, delta per year for each gas
    st.markdown('<h3 style="color: #2c3e50;">Gas Concentration and Delta Table</h3>', unsafe_allow_html=True)
    period_years = data['time_period'] / 365.0 if data['time_period'] else 1
    gases = ['H2', 'CH4', 'C2H6', 'C2H4', 'C2H2', 'CO', 'CO2']
    table_data = []
    for gas in gases:
        initial = data['initial_data'][gas]
        final = data['final_data'][gas]
        delta = final - initial
        delta_per_year = delta / period_years if period_years > 0 else 0
        table_data.append({
            'Gas': gas,
            'Initial (μL/L)': initial,
            'Final (μL/L)': final,
            'Delta': delta if data['time_period'] else 'N/A',
            'Delta per Year': delta_per_year if data['time_period'] else 'N/A'
        })
    df = pd.DataFrame(table_data)
    st.dataframe(df, use_container_width=True)
    
    # O2/N2 Ratio
    st.markdown('<h3 style="color: #2c3e50;">O2/N2 Ratio (Calculated)</h3>', unsafe_allow_html=True)
    o2n2_init = (data['initial_data'].get('O2', 0), data['initial_data'].get('N2', 0))
    o2n2_final = (data['final_data'].get('O2', 0), data['final_data'].get('N2', 0))
    o2n2_init_ratio = o2n2_init[0] / o2n2_init[1] if o2n2_init[1] else 'N/A'
    o2n2_final_ratio = o2n2_final[0] / o2n2_final[1] if o2n2_final[1] else 'N/A'
    st.write(f"Initial O2/N2 Ratio: {o2n2_init_ratio}")
    st.write(f"Final O2/N2 Ratio: {o2n2_final_ratio}")

def export_data_page():
    st.markdown('<h2 class="section-header">📤 Export Data</h2>', unsafe_allow_html=True)
    
    if not st.session_state.data_submitted or not st.session_state.transformer_data:
        st.warning("⚠️ No data available to export. Please submit data first.")
        return
    
    data = st.session_state.transformer_data
    
    # Create comprehensive dataframe
    gases = list(data['initial_data'].keys())
    export_df = pd.DataFrame({
        'Gas': gases + ['O2/N2 Ratio'],
        'Initial_Concentration_μL_L': [data['initial_data'][gas] for gas in gases] + [data['initial_data'].get('O2_N2_Ratio', None)],
        'Final_Concentration_μL_L': [data['final_data'][gas] for gas in gases] + [data['final_data'].get('O2_N2_Ratio', None)],
        'Absolute_Change': [data['final_data'][gas] - data['initial_data'][gas] for gas in gases] + [
            (data['final_data'].get('O2_N2_Ratio', 0) - data['initial_data'].get('O2_N2_Ratio', 0))
        ],
        'Percent_Change': [
            (data['final_data'][gas] - data['initial_data'][gas]) / data['initial_data'][gas] * 100 if data['initial_data'][gas] > 0 else 0 for gas in gases
        ] + [
            ((data['final_data'].get('O2_N2_Ratio', 0) - data['initial_data'].get('O2_N2_Ratio', 0)) / data['initial_data'].get('O2_N2_Ratio', 1) * 100) if data['initial_data'].get('O2_N2_Ratio', 0) > 0 else 0
        ]
    })
    
    # Add metadata
    metadata = {
        'Time_Period_Days': data['time_period'],
        'Number_of_Samples': data['num_samples'],
        'Transformer_Age_Months': data['transformer_age'],
        'Analysis_Date': data['timestamp']
    }
    
    st.markdown('<h3 style="color: #2c3e50;">Export Options</h3>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # CSV Export
        csv_data = export_df.to_csv(index=False)
        st.download_button(
            label="📄 Download as CSV",
            data=csv_data,
            file_name=f"transformer_gas_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )
        
        # JSON Export
        json_data = json.dumps({
            'metadata': metadata,
            'gas_data': export_df.to_dict('records')
        }, indent=2)
        
        st.download_button(
            label="📋 Download as JSON",
            data=json_data,
            file_name=f"transformer_gas_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            mime="application/json"
        )
    
    with col2:
        # Excel Export
        excel_buffer = pd.ExcelWriter('temp_transformer_data.xlsx', engine='openpyxl')
        export_df.to_excel(excel_buffer, sheet_name='Gas_Analysis', index=False)
        
        # Add metadata sheet
        metadata_df = pd.DataFrame(list(metadata.items()), columns=['Parameter', 'Value'])
        metadata_df.to_excel(excel_buffer, sheet_name='Metadata', index=False)
        
        excel_buffer.close()
        
        with open('temp_transformer_data.xlsx', 'rb') as f:
            excel_data = f.read()
        
        st.download_button(
            label="📊 Download as Excel",
            data=excel_data,
            file_name=f"transformer_gas_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
        # Clean up temporary file
        if os.path.exists('temp_transformer_data.xlsx'):
            os.remove('temp_transformer_data.xlsx')
    
    # Display preview
    st.markdown('<h3 style="color: #2c3e50;">Data Preview</h3>', unsafe_allow_html=True)
    st.dataframe(export_df, use_container_width=True)

def save_data_to_file(data):
    """Save data to a JSON file for persistence"""
    filename = f"transformer_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    main() 