import torch
import torch.nn as nn

class RegionAwarenessModule(nn.Module):
    """Region Awareness Module that learns region importance weights."""
    
    def __init__(self, 
                 region_feature_dim: int = 384,
                 global_feature_dim: int = 768):
        super(RegionAwarenessModule, self).__init__()
        
        # Calculate the correct input dimension
        input_dim = region_feature_dim * 3 + global_feature_dim
        
        # Region awareness network
        self.region_awareness_net = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 3),
            nn.Softmax(dim=2)
        )
        
        # Store dimensions for reference (no print)
        self.region_feature_dim = region_feature_dim
        self.global_feature_dim = global_feature_dim
        self.input_dim = input_dim
    
    def forward(self, region_features: torch.Tensor, 
                global_features: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the Region Awareness Module.
        
        Args:
            region_features: Region features [B, T, D_region*3]
            global_features: Global features [B, T, D_global]
        
        Returns:
            Region weights [B, T, 3]
        """
        B, T, _ = region_features.shape
        
        # Expand global features to match region features
        if global_features.dim() == 2:
            global_features = global_features.unsqueeze(1).expand(-1, T, -1)
        elif global_features.dim() == 3 and global_features.shape[1] == 1:
            global_features = global_features.expand(-1, T, -1)
        
        # Ensure global features have correct shape
        global_expanded = global_features.view(B, T, -1)
        
        # Concatenate region and global features
        combined = torch.cat([region_features, global_expanded], dim=2)
        
        # Compute region weights
        weights = self.region_awareness_net(combined)
        
        return weights