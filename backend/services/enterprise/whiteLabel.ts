// services/enterprise/whiteLabel.ts - White-label customization
import crypto from 'crypto';

export interface WhiteLabelConfig {
  configId: string;
  tenantId: string;
  isActive: boolean;
  branding: {
    logo?: string;
    favicon?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  domain: {
    customDomain?: string;
    subdomain?: string;
    sslEnabled: boolean;
  };
  email: {
    fromName: string;
    fromEmail: string;
    customTemplates?: boolean;
  };
  mobile: {
    appName: string;
    appIcon?: string;
    splashScreen?: string;
    theme: 'light' | 'dark' | 'auto';
  };
  features: {
    showBranding: boolean;
    showPoweredBy: boolean;
    customFooter: boolean;
    customHeader: boolean;
    customLogin: boolean;
  };
  customContent: {
    loginMessage?: string;
    welcomeMessage?: string;
    footerText?: string;
    termsOfService?: string;
    privacyPolicy?: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface WhiteLabelAsset {
  assetId: string;
  tenantId: string;
  assetType: 'logo' | 'favicon' | 'app_icon' | 'splash_screen' | 'background';
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: number;
}

export interface WhiteLabelTheme {
  themeId: string;
  tenantId: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    unit: number;
    scale: number[];
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  createdAt: number;
  updatedAt: number;
}

export class WhiteLabelService {
  private configs: Map<string, WhiteLabelConfig> = new Map();
  private assets: Map<string, WhiteLabelAsset> = new Map();
  private themes: Map<string, WhiteLabelTheme> = new Map();

  /**
   * Create white-label configuration
   */
  createConfig(
    tenantId: string,
    branding: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      textColor: string;
      fontFamily: string;
    },
    domain: {
      customDomain?: string;
      subdomain?: string;
      sslEnabled: boolean;
    },
    email: {
      fromName: string;
      fromEmail: string;
      customTemplates?: boolean;
    },
    mobile: {
      appName: string;
      appIcon?: string;
      splashScreen?: string;
      theme: 'light' | 'dark' | 'auto';
    }
  ): WhiteLabelConfig {
    const configId = crypto.randomBytes(16).toString('hex');

    const config: WhiteLabelConfig = {
      configId,
      tenantId,
      isActive: true,
      branding,
      domain,
      email,
      mobile,
      features: {
        showBranding: true,
        showPoweredBy: true,
        customFooter: false,
        customHeader: false,
        customLogin: false
      },
      customContent: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.configs.set(configId, config);
    return config;
  }

  /**
   * Get config by tenant ID
   */
  getConfig(tenantId: string): WhiteLabelConfig | null {
    return Array.from(this.configs.values())
      .find(c => c.tenantId === tenantId && c.isActive) || null;
  }

  /**
   * Get config by domain
   */
  getConfigByDomain(domain: string): WhiteLabelConfig | null {
    return Array.from(this.configs.values())
      .find(c => 
        c.isActive && 
        (c.domain.customDomain === domain || c.domain.subdomain === domain)
      ) || null;
  }

  /**
   * Update config
   */
  updateConfig(
    configId: string,
    updates: {
      branding?: {
        logo?: string;
        favicon?: string;
        primaryColor?: string;
        secondaryColor?: string;
        accentColor?: string;
        backgroundColor?: string;
        textColor?: string;
        fontFamily?: string;
      };
      domain?: {
        customDomain?: string;
        subdomain?: string;
        sslEnabled?: boolean;
      };
      email?: {
        fromName?: string;
        fromEmail?: string;
        customTemplates?: boolean;
      };
      mobile?: {
        appName?: string;
        appIcon?: string;
        splashScreen?: string;
        theme?: 'light' | 'dark' | 'auto';
      };
      features?: {
        showBranding?: boolean;
        showPoweredBy?: boolean;
        customFooter?: boolean;
        customHeader?: boolean;
        customLogin?: boolean;
      };
      customContent?: {
        loginMessage?: string;
        welcomeMessage?: string;
        footerText?: string;
        termsOfService?: string;
        privacyPolicy?: string;
      };
      isActive?: boolean;
    }
  ): WhiteLabelConfig | null {
    const config = this.configs.get(configId);
    
    if (!config) {
      return null;
    }

    if (updates.branding) {
      config.branding = { ...config.branding, ...updates.branding };
    }
    if (updates.domain) {
      config.domain = { ...config.domain, ...updates.domain };
    }
    if (updates.email) {
      config.email = { ...config.email, ...updates.email };
    }
    if (updates.mobile) {
      config.mobile = { ...config.mobile, ...updates.mobile };
    }
    if (updates.features) {
      config.features = { ...config.features, ...updates.features };
    }
    if (updates.customContent) {
      config.customContent = { ...config.customContent, ...updates.customContent };
    }
    if (updates.isActive !== undefined) {
      config.isActive = updates.isActive;
    }

    config.updatedAt = Date.now();
    this.configs.set(configId, config);

    return config;
  }

  /**
   * Delete config
   */
  deleteConfig(configId: string): boolean {
    const config = this.configs.get(configId);
    
    if (config) {
      config.isActive = false;
      this.configs.set(configId, config);
      return true;
    }

    return false;
  }

  /**
   * Upload asset
   */
  uploadAsset(
    tenantId: string,
    assetType: 'logo' | 'favicon' | 'app_icon' | 'splash_screen' | 'background',
    fileName: string,
    fileSize: number,
    mimeType: string
  ): WhiteLabelAsset {
    const assetId = crypto.randomBytes(16).toString('hex');

    const asset: WhiteLabelAsset = {
      assetId,
      tenantId,
      assetType,
      fileName,
      fileSize,
      mimeType,
      url: `https://simtrace.com/assets/${tenantId}/${assetId}/${fileName}`,
      uploadedAt: Date.now()
    };

    this.assets.set(assetId, asset);
    return asset;
  }

  /**
   * Get assets for tenant
   */
  getAssetsForTenant(tenantId: string): WhiteLabelAsset[] {
    return Array.from(this.assets.values())
      .filter(a => a.tenantId === tenantId);
  }

  /**
   * Get asset by type
   */
  getAssetByType(tenantId: string, assetType: 'logo' | 'favicon' | 'app_icon' | 'splash_screen' | 'background'): WhiteLabelAsset | null {
    return Array.from(this.assets.values())
      .find(a => a.tenantId === tenantId && a.assetType === assetType) || null;
  }

  /**
   * Delete asset
   */
  deleteAsset(assetId: string): boolean {
    return this.assets.delete(assetId);
  }

  /**
   * Create theme
   */
  createTheme(
    tenantId: string,
    name: string,
    description: string,
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      success: string;
      warning: string;
      error: string;
    },
    typography: {
      fontFamily: string;
      fontSize: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
      };
      fontWeight: {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
      };
    },
    spacing: {
      unit: number;
      scale: number[];
    },
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    },
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    }
  ): WhiteLabelTheme {
    const themeId = crypto.randomBytes(16).toString('hex');

    const theme: WhiteLabelTheme = {
      themeId,
      tenantId,
      name,
      description,
      colors,
      typography,
      spacing,
      borderRadius,
      shadows,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.themes.set(themeId, theme);
    return theme;
  }

  /**
   * Get theme by ID
   */
  getTheme(themeId: string): WhiteLabelTheme | null {
    return this.themes.get(themeId) || null;
  }

  /**
   * Get themes for tenant
   */
  getThemesForTenant(tenantId: string): WhiteLabelTheme[] {
    return Array.from(this.themes.values())
      .filter(t => t.tenantId === tenantId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Update theme
   */
  updateTheme(
    themeId: string,
    updates: {
      name?: string;
      description?: string;
      colors?: any;
      typography?: any;
      spacing?: any;
      borderRadius?: any;
      shadows?: any;
    }
  ): WhiteLabelTheme | null {
    const theme = this.themes.get(themeId);
    
    if (!theme) {
      return null;
    }

    if (updates.name) theme.name = updates.name;
    if (updates.description) theme.description = updates.description;
    if (updates.colors) theme.colors = { ...theme.colors, ...updates.colors };
    if (updates.typography) theme.typography = { ...theme.typography, ...updates.typography };
    if (updates.spacing) theme.spacing = { ...theme.spacing, ...updates.spacing };
    if (updates.borderRadius) theme.borderRadius = { ...theme.borderRadius, ...updates.borderRadius };
    if (updates.shadows) theme.shadows = { ...theme.shadows, ...updates.shadows };

    theme.updatedAt = Date.now();
    this.themes.set(themeId, theme);

    return theme;
  }

  /**
   * Delete theme
   */
  deleteTheme(themeId: string): boolean {
    return this.themes.delete(themeId);
  }

  /**
   * Export theme as CSS
   */
  exportThemeAsCSS(themeId: string): string {
    const theme = this.themes.get(themeId);
    
    if (!theme) {
      throw new Error('Theme not found');
    }

    let css = `:root {\n`;
    
    // Colors
    for (const [key, value] of Object.entries(theme.colors)) {
      const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      css += `  ${cssVar}: ${value};\n`;
    }

    // Typography
    css += `  --font-family: ${theme.typography.fontFamily};\n`;
    for (const [key, value] of Object.entries(theme.typography.fontSize)) {
      css += `  --font-size-${key}: ${value};\n`;
    }
    for (const [key, value] of Object.entries(theme.typography.fontWeight)) {
      css += `  --font-weight-${key}: ${value};\n`;
    }

    // Spacing
    css += `  --spacing-unit: ${theme.spacing.unit}px;\n`;
    theme.spacing.scale.forEach((value, index) => {
      css += `  --spacing-${index}: ${value * theme.spacing.unit}px;\n`;
    });

    // Border radius
    for (const [key, value] of Object.entries(theme.borderRadius)) {
      css += `  --border-radius-${key}: ${value};\n`;
    }

    // Shadows
    for (const [key, value] of Object.entries(theme.shadows)) {
      css += `  --shadow-${key}: ${value};\n`;
    }

    css += `}\n`;

    return css;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalConfigs: number;
    totalAssets: number;
    totalThemes: number;
    activeConfigs: number;
    assetsByType: { [key: string]: number };
  } {
    const configs = Array.from(this.configs.values());
    const assets = Array.from(this.assets.values());

    const assetsByType: { [key: string]: number } = {};

    for (const asset of assets) {
      assetsByType[asset.assetType] = (assetsByType[asset.assetType] || 0) + 1;
    }

    return {
      totalConfigs: configs.length,
      totalAssets: assets.length,
      totalThemes: this.themes.size,
      activeConfigs: configs.filter(c => c.isActive).length,
      assetsByType
    };
  }

  /**
   * Clear old assets
   */
  clearOldAssets(maxAge: number = 2592000000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [assetId, asset] of this.assets.entries()) {
      if (now - asset.uploadedAt > maxAge) {
        this.assets.delete(assetId);
        cleared++;
      }
    }

    return cleared;
  }
}

export const whiteLabelService = new WhiteLabelService();
