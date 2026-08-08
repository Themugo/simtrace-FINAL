export interface MLModelSpec {
  name: string;
  version: string;
  type: "classification" | "anomaly_detection" | "clustering";
  framework: "rule_engine" | "tensorflow" | "pytorch" | "external_api";
  active: boolean;
}

export const ML_MODEL_REGISTRY: MLModelSpec[] = [
  {
    name: "SimTrace-RiskEngine-RuleSet-v1",
    version: "1.2.0",
    type: "classification",
    framework: "rule_engine",
    active: true,
  },
  {
    name: "SimTrace-SpatialAnomalyDetector",
    version: "0.9.1-beta",
    type: "anomaly_detection",
    framework: "tensorflow",
    active: false,
  },
];
