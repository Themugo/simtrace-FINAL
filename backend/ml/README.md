# Machine Learning Pipeline

ML models for theft prediction, fraud scoring, movement prediction, and recovery success.

## Features

- **Theft Prediction**: Predict likelihood of device theft
- **Fraud Scoring**: Calculate fraud probability
- **Movement Prediction**: Predict next location based on patterns
- **Recovery Success**: Predict probability of successful recovery
- **Model Training**: Train and retrain models with new data
- **Prediction History**: Track all predictions for analysis

## Usage

### Predict Theft Likelihood

```typescript
import { predictTheft } from './ml/index.js';

const prediction = predictTheft({
  riskScore: 85,
  movementCount: 60,
  simChanges: 1,
});

console.log('Theft likelihood:', prediction.prediction);
console.log('Confidence:', prediction.confidence);
```

### Predict Fraud Score

```typescript
import { predictFraud } from './ml/index.js';

const prediction = predictFraud({
  riskScore: 90,
  simChanges: 2,
  deviceAge: 15,
  locationChanges: 12,
});

console.log('Fraud score:', prediction.prediction);
```

### Predict Movement

```typescript
import { predictMovement } from './ml/index.js';

const prediction = predictMovement({
  currentLocation: { lat: -1.2921, lng: 36.8219 },
  knownLocations: [
    { lat: -1.2921, lng: 36.8219, typicalHour: 9 },
    { lat: -1.2856, lng: 36.8282, typicalHour: 18 },
  ],
  timeOfDay: 9,
});

console.log('Predicted location:', prediction.features.predictedLocation);
console.log('Confidence:', prediction.prediction);
```

### Predict Recovery Success

```typescript
import { predictRecoverySuccess } from './ml/index.js';

const prediction = predictRecoverySuccess({
  riskScore: 45,
  movementPattern: 'commute',
  knownLocationsCount: 3,
  timeSinceTheft: 12,
});

console.log('Recovery likelihood:', prediction.prediction);
```

### Add Training Data

```typescript
import { addTrainingData } from './ml/index.js';

addTrainingData({
  features: {
    riskScore: 85,
    movementCount: 60,
    simChanges: 1,
  },
  label: 1, // 1 = theft occurred, 0 = no theft
  timestamp: new Date(),
});
```

### Train Model

```typescript
import { trainModel } from './ml/index.js';

await trainModel('theft_prediction_v1');
```

### Get Model Status

```typescript
import { getModel, getAllModels } from './ml/index.js';

const model = getModel('theft_prediction_v1');
console.log('Model status:', model?.status);
console.log('Model accuracy:', model?.accuracy);

const allModels = getAllModels();
console.log('All models:', allModels);
```

### Get Predictions

```typescript
import { getPredictions } from './ml/index.js';

// Get all predictions
const allPredictions = getPredictions(undefined, 100);

// Get predictions for specific model
const theftPredictions = getPredictions('theft_prediction_v1', 100);
```

## Model Types

- **theft_prediction**: Predict likelihood of device theft
- **fraud_scoring**: Calculate fraud probability
- **movement_prediction**: Predict next location
- **recovery_success**: Predict recovery success probability

## Prediction Structure

```typescript
interface MLPrediction {
  model: string;
  prediction: number; // 0-1 probability
  confidence: number; // 0-1 confidence
  features: Record<string, any>;
  timestamp: Date;
}
```

## Training Data Structure

```typescript
interface MLTrainingData {
  features: Record<string, any>;
  label: number; // 0 or 1 for binary classification
  timestamp: Date;
}
```

## Model Structure

```typescript
interface MLModel {
  name: string;
  type: 'theft_prediction' | 'fraud_scoring' | 'movement_prediction' | 'recovery_success';
  version: string;
  status: 'training' | 'ready' | 'error';
  accuracy?: number;
}
```

## Production ML Integration

For production deployments, integrate with actual ML libraries:

```typescript
import * as tf from '@tensorflow/tfjs';

// Train model with TensorFlow.js
async function trainTensorFlowModel(trainingData: MLTrainingData[]) {
  const model = tf.sequential();
  
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    inputShape: [Object.keys(trainingData[0].features).length]
  }));
  
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));
  
  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });
  
  // Train model
  await model.fit(/* training data */);
  
  return model;
}
```

## Best Practices

1. **Feature Engineering**: Use relevant features for predictions
2. **Data Quality**: Ensure training data is clean and representative
3. **Model Retraining**: Retrain models regularly with new data
4. **Prediction Monitoring**: Monitor prediction accuracy over time
5. **Feature Scaling**: Scale features appropriately for ML models
6. **Cross-Validation**: Use cross-validation to evaluate model performance

## Performance Considerations

1. **Model Caching**: Cache trained models in memory
2. **Batch Predictions**: Batch predictions for efficiency
3. **Feature Extraction**: Precompute features when possible
4. **Model Size**: Keep models small for fast inference
5. **GPU Acceleration**: Use GPU for training if available

## Future Enhancements

- Integrate with TensorFlow.js or scikit-learn
- Add model versioning and A/B testing
- Implement feature importance analysis
- Add model explainability (SHAP values)
- Implement online learning for continuous improvement
- Add anomaly detection with unsupervised learning
