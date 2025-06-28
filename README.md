# ⚡ Transformer Gas Analysis System

A comprehensive Streamlit application for analyzing transformer gas data to monitor transformer health and detect potential issues.

## 🎯 Features

- **Data Entry**: Input transformer information and gas concentration data
- **Visual Analysis**: Interactive charts and graphs for data comparison
- **Export Options**: Download data in CSV, JSON, and Excel formats
- **Modern UI**: Beautiful and intuitive user interface

## 📊 Gas Types Analyzed

The application tracks the following gases in μL/L (micro-liters per liter):

- **H2** (Hydrogen)
- **CO2** (Carbon Dioxide)
- **CO** (Carbon Monoxide)
- **C2H4** (Ethylene)
- **C2H6** (Ethane)
- **CH4** (Methane)
- **C2H2** (Acetylene)

## 🚀 Installation

1. **Clone or download the project files**
   ```bash
   # If using git
   git clone <repository-url>
   cd DGA
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   streamlit run app.py
   ```

## 📖 Usage Guide

### 1. Data Entry Page
- **Transformer Information**:
  - Time Period (months): Duration between initial and final measurements
  - Number of Samples: Total samples taken during the period
  - Transformer Age (years): Age of the transformer

- **Gas Analysis Data**:
  - Enter gas concentrations for both initial and final periods
  - Use the tabbed interface to switch between periods
  - All values are in μL/L (micro-liters per liter)

### 2. View Results Page
- **Metrics Display**: Shows key transformer information
- **Comparison Charts**: Visual comparison of initial vs final gas concentrations
- **Change Analysis**: Absolute and percentage changes in gas levels
- **Interactive Visualizations**: Hover for detailed information

### 3. Export Data Page
- **Multiple Formats**: Export as CSV, JSON, or Excel
- **Comprehensive Data**: Includes all analysis results and metadata
- **Timestamped Files**: Automatic file naming with timestamps

## 🔧 Technical Details

### Dependencies
- **Streamlit**: Web application framework
- **Pandas**: Data manipulation and analysis
- **Plotly**: Interactive visualizations
- **OpenPyXL**: Excel file handling

### File Structure
```
DGA/
├── app.py              # Main application file
├── requirements.txt    # Python dependencies
├── README.md          # This file
└── transformer_data_*.json  # Generated data files
```

## 📈 Data Analysis Features

### Gas Concentration Monitoring
- Track changes in dissolved gas concentrations over time
- Identify trends and potential issues
- Compare initial and final measurements

### Visual Analytics
- **Bar Charts**: Side-by-side comparison of gas levels
- **Change Analysis**: Absolute and percentage changes
- **Color-coded Results**: Green for improvements, red for increases

### Export Capabilities
- **CSV**: Standard spreadsheet format
- **JSON**: Structured data format
- **Excel**: Multi-sheet workbook with analysis and metadata

## 🎨 User Interface

- **Responsive Design**: Works on desktop and mobile devices
- **Intuitive Navigation**: Sidebar navigation between pages
- **Modern Styling**: Professional appearance with custom CSS
- **Interactive Elements**: Hover effects and dynamic content

## 🔍 Transformer Health Indicators

The application helps identify:
- **Normal Aging**: Gradual changes in gas levels
- **Thermal Faults**: Elevated levels of specific gases
- **Electrical Faults**: Characteristic gas ratios
- **Insulation Deterioration**: Changes in gas composition

## 📝 Data Validation

- **Input Validation**: Ensures data is within reasonable ranges
- **Error Handling**: Graceful handling of missing or invalid data
- **Data Persistence**: Automatic saving of submitted data

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   streamlit run app.py --server.port 8502
   ```

2. **Missing Dependencies**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

3. **Browser Issues**
   - Clear browser cache
   - Try different browser
   - Check firewall settings

## 📞 Support

For technical support or feature requests, please refer to the project documentation or contact the development team.

## 📄 License

This project is developed for educational and professional use in transformer monitoring and analysis.

---

**Note**: This application is designed for transformer gas analysis and should be used by qualified personnel familiar with transformer monitoring procedures. 