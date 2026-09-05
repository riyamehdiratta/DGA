import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from 'react';

import {

  createAnalysisApi,

  createSampleApi,

  createTransformerApi,

  deleteTransformerApi,

  deltaResultToScalars,

  fetchBootstrap,

  runAnalysisApi,

  updateTransformerApi,

} from '@/api';

import {

  buildAnalysisResultDetail,

  buildReportSections,

  getAllTransformerSummaries,

  getAnalysisById,

  getAnalysisHistoryRows,

  getDashboardStats,

  getGasTrendData,

  getReportSummaries,

  getSampleById,

  getSampleHistoryRows,

  getSamplesByTransformerId,

  getStatusTrendData,

  getSubstations,

  getTransformerById,

  getTransformerSummary,

} from '@/lib/selectors';

import type {

  AnalysisResult,

  AppState,

  CreateAnalysisInput,

  CreateSampleInput,

  CreateTransformerInput,

  DgaSample,

  Transformer,

  UpdateTransformerInput,

} from '@/types';



const emptyState: AppState = {

  transformers: [],

  samples: [],

  analyses: [],

};



interface AppContextValue {

  state: AppState;

  isReady: boolean;

  error: string | null;



  refresh: () => Promise<void>;



  createTransformer: (input: CreateTransformerInput) => Promise<Transformer>;

  updateTransformer: (id: string, input: UpdateTransformerInput) => Promise<Transformer>;

  deleteTransformer: (id: string) => Promise<void>;



  createSample: (input: CreateSampleInput) => Promise<DgaSample>;

  createAnalysis: (input: CreateAnalysisInput) => Promise<AnalysisResult>;

  runAnalysis: (

    transformerId: string,

    sampleInput: Omit<CreateSampleInput, 'transformerId'>,

  ) => Promise<AnalysisResult>;



  getTransformer: (id: string) => Transformer | undefined;

  getSample: (id: string) => DgaSample | undefined;

  getAnalysis: (id: string) => AnalysisResult | undefined;

  getTransformerSummaries: () => ReturnType<typeof getAllTransformerSummaries>;

  getTransformerSummary: (id: string) => ReturnType<typeof getTransformerSummary>;

  getSampleHistory: (transformerId: string) => ReturnType<typeof getSampleHistoryRows>;

  getSamplesForTransformer: (transformerId: string) => DgaSample[];

  getAnalysisHistory: () => ReturnType<typeof getAnalysisHistoryRows>;

  getAnalysisDetail: (id: string) => ReturnType<typeof buildAnalysisResultDetail>;

  getDashboardStats: () => ReturnType<typeof getDashboardStats>;

  getSubstations: () => string[];

  getGasTrends: (transformerId: string) => ReturnType<typeof getGasTrendData>;

  getStatusTrends: (transformerId: string) => ReturnType<typeof getStatusTrendData>;

  getReports: () => ReturnType<typeof getReportSummaries>;

  getReportSections: (analysisId: string) => ReturnType<typeof buildReportSections> | null;

}



const AppContext = createContext<AppContextValue | null>(null);



export function AppProvider({ children }: { children: ReactNode }) {

  const [state, setState] = useState<AppState>(emptyState);

  const [isReady, setIsReady] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const refresh = useCallback(async () => {

    const data = await fetchBootstrap();

    setState(data);

  }, []);



  useEffect(() => {

    let cancelled = false;



    async function load() {

      try {

        const data = await fetchBootstrap();

        if (!cancelled) {

          setState(data);

          setError(null);

        }

      } catch (err) {

        if (!cancelled) {

          const message =

            err instanceof Error ? err.message : 'Failed to load application data';

          setError(message);

        }

      } finally {

        if (!cancelled) {

          setIsReady(true);

        }

      }

    }



    void load();



    return () => {

      cancelled = true;

    };

  }, []);



  const createTransformer = useCallback(

    async (input: CreateTransformerInput): Promise<Transformer> => {

      const transformer = await createTransformerApi(input);

      setState((prev) => ({

        ...prev,

        transformers: [...prev.transformers, transformer],

      }));

      return transformer;

    },

    [],

  );



  const updateTransformer = useCallback(

    async (id: string, input: UpdateTransformerInput): Promise<Transformer> => {

      const transformer = await updateTransformerApi(id, input);

      setState((prev) => ({

        ...prev,

        transformers: prev.transformers.map((t) => (t.id === id ? transformer : t)),

      }));

      return transformer;

    },

    [],

  );



  const deleteTransformer = useCallback(async (id: string): Promise<void> => {

    await deleteTransformerApi(id);

    setState((prev) => {

      const sampleIds = prev.samples

        .filter((s) => s.transformerId === id)

        .map((s) => s.id);



      return {

        transformers: prev.transformers.filter((t) => t.id !== id),

        samples: prev.samples.filter((s) => s.transformerId !== id),

        analyses: prev.analyses.filter(

          (a) => a.transformerId !== id && !sampleIds.includes(a.sampleId),

        ),

      };

    });

  }, []);



  const createSample = useCallback(

    async (input: CreateSampleInput): Promise<DgaSample> => {

      const sample = await createSampleApi(input.transformerId, input);

      setState((prev) => ({

        ...prev,

        samples: [...prev.samples, sample],

      }));

      return sample;

    },

    [],

  );



  const createAnalysis = useCallback(

    async (input: CreateAnalysisInput): Promise<AnalysisResult> => {

      const analysis = await createAnalysisApi(input.transformerId, {

        sampleId: input.sampleId,

        normProfile: input.normProfile,

        o2n2Ratio: input.o2n2Ratio,

        status: input.status,

        delta: deltaResultToScalars(input.delta),

      });

      setState((prev) => ({

        ...prev,

        analyses: [...prev.analyses, analysis],

      }));

      return analysis;

    },

    [],

  );



  const runAnalysis = useCallback(

    async (

      transformerId: string,

      sampleInput: Omit<CreateSampleInput, 'transformerId'>,

    ): Promise<AnalysisResult> => {

      const { sample, analysis } = await runAnalysisApi(transformerId, sampleInput);



      setState((prev) => ({

        ...prev,

        samples: [...prev.samples, sample],

        analyses: [...prev.analyses, analysis],

      }));



      return analysis;

    },

    [],

  );



  const value = useMemo<AppContextValue>(

    () => ({

      state,

      isReady,

      error,

      refresh,



      createTransformer,

      updateTransformer,

      deleteTransformer,

      createSample,

      createAnalysis,

      runAnalysis,



      getTransformer: (id) => getTransformerById(state, id),

      getSample: (id) => getSampleById(state, id),

      getAnalysis: (id) => getAnalysisById(state, id),

      getTransformerSummaries: () => getAllTransformerSummaries(state),

      getTransformerSummary: (id) => getTransformerSummary(state, id),

      getSampleHistory: (transformerId) => getSampleHistoryRows(state, transformerId),

      getSamplesForTransformer: (transformerId) =>

        getSamplesByTransformerId(state, transformerId),

      getAnalysisHistory: () => getAnalysisHistoryRows(state),

      getAnalysisDetail: (id) => buildAnalysisResultDetail(state, id),

      getDashboardStats: () => getDashboardStats(state),

      getSubstations: () => getSubstations(state),

      getGasTrends: (transformerId) => getGasTrendData(state, transformerId),

      getStatusTrends: (transformerId) => getStatusTrendData(state, transformerId),

      getReports: () => getReportSummaries(state),

      getReportSections: (analysisId) => {

        const analysis = getAnalysisById(state, analysisId);

        if (!analysis) return null;

        const transformer = getTransformerById(state, analysis.transformerId);

        const sample = getSampleById(state, analysis.sampleId);

        if (!transformer || !sample) return null;

        return buildReportSections(transformer, sample, analysis);

      },

    }),

    [

      state,

      isReady,

      error,

      refresh,

      createTransformer,

      updateTransformer,

      deleteTransformer,

      createSample,

      createAnalysis,

      runAnalysis,

    ],

  );



  if (!isReady) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-gray-600">

        Loading application data...

      </div>

    );

  }



  if (error) {

    return (

      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center text-sm text-gray-600">

        <p className="font-medium text-gray-900">Unable to connect to the API</p>

        <p>{error}</p>

        <p className="text-xs text-gray-500">

          Ensure PostgreSQL is running and the backend server is started on port 3001.

        </p>

        <button

          type="button"

          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"

          onClick={() => {

            setIsReady(false);

            setError(null);

            void refresh().finally(() => setIsReady(true));

          }}

        >

          Retry

        </button>

      </div>

    );

  }



  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;

}



export function useAppState(): AppContextValue {

  const context = useContext(AppContext);

  if (!context) {

    throw new Error('useAppState must be used within AppProvider');

  }

  return context;

}

