import numpy as np
from sklearn.metrics import accuracy_score, average_precision_score, confusion_matrix
from sklearn.metrics import roc_auc_score

def compute_metrics(predictions, labels):
    """
    Compute evaluation metrics with proper handling of prediction types.
    
    Args:
        predictions: Can be logits, probabilities, or binary predictions
        labels: Ground truth labels (0 or 1)
    
    Returns:
        Dictionary containing ACC, AP, FPR, FNR
    """
    predictions = np.array(predictions)
    labels = np.array(labels)
    
    # If predictions are logits (large magnitude values), convert to probabilities
    if np.max(np.abs(predictions)) > 10:
        predictions = 1 / (1 + np.exp(-predictions))  # sigmoid
    
    # If predictions are probabilities, convert to binary
    if np.max(predictions) <= 1 and np.min(predictions) >= 0:
        binary_preds = (predictions >= 0.5).astype(int)
    else:
        binary_preds = predictions.astype(int)
    
    # Calculate metrics
    acc = accuracy_score(labels, binary_preds)
    
    try:
        ap = average_precision_score(labels, predictions)
    except:
        ap = 0.5
    
    if len(np.unique(labels)) > 1:
        tn, fp, fn, tp = confusion_matrix(labels, binary_preds).ravel()
    else:
        tn, fp, fn, tp = 0, 0, 0, 0
    
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
    
    return {
        'accuracy': float(acc),
        'ap': float(ap),
        'fpr': float(fpr),
        'fnr': float(fnr)
    }

def calculate_auc_score(predictions, labels):
    """
    Calculate Area Under Curve (AUC) score.
    
    Args:
        predictions: Binary predictions (0 or 1)
        labels: Ground truth labels (0 or 1)
    
    Returns:
        AUC score
    """
    try:
        return roc_auc_score(labels, predictions)
    except:
        return 0.5  # Default if calculation fails