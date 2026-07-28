import torch
import torch.nn as nn

def fuse_features(region_features: torch.Tensor, 
                  global_features: torch.Tensor,
                  weights: torch.Tensor) -> torch.Tensor:
    """
    Fuse region features with global features using attention weights.
    
    Args:
        region_features: Region features [B, T, D_region*3]
        global_features: Global features [B, T, D_global]
        weights: Region weights [B, T, 3]
    
    Returns:
        Fused features [B, T, D_fused]
    """
    # Split region features into head, face, lip
    B, T, D = region_features.shape
    region_dim = D // 3
    head_features = region_features[:, :, :region_dim]
    face_features = region_features[:, :, region_dim:2*region_dim]
    lip_features = region_features[:, :, 2*region_dim:]
    
    # Apply weights
    weighted_head = head_features * weights[:, :, 0:1]
    weighted_face = face_features * weights[:, :, 1:2]
    weighted_lip = lip_features * weights[:, :, 2:3]
    
    # Ensure global_features has correct shape [B, T, D_global]
    if global_features.dim() == 2:
        global_features = global_features.unsqueeze(1).expand(-1, T, -1)
    
    # Fuse features by concatenation
    fused_features = torch.cat([
        weighted_head, 
        weighted_face, 
        weighted_lip,
        global_features
    ], dim=2)
    
    return fused_features

def compute_lra_loss(weights: torch.Tensor) -> torch.Tensor:
    """
    Compute Region Awareness Loss as in equation (5) of the paper.
    
    Args:
        weights: Region weights [B, T, 3]
    
    Returns:
        Region Awareness Loss
    """
    # Get max weights across regions
    max_weights, _ = torch.max(weights, dim=2)  # [B, T]
    
    # Get head weights
    head_weights = weights[:, :, 0]  # [B, T]
    
    # Compute LRA loss: Σ exp([ω^i_j]max - [ω^i_j]h)
    lra_loss = torch.mean(torch.exp(max_weights - head_weights))
    
    return lra_loss