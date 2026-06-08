```tsx
import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../../application/state/stores/uiStore';
import { Button } from '../shared/FallbackUI';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/FallbackUI';
import { Label } from '../shared/FallbackUI';
import { Select } from '../shared/FallbackUI';
import { Slider } from '../shared/FallbackUI';
import { Switch } from '../shared/FallbackUI';
import { Alert, AlertDescription } from '../shared/FallbackUI';
import { AlertCircle } from 'lucide-react';

type ThemePreset = 'dark' | 'light' | 'midnight' | 'forest' | 'ocean';
type TransparencyLevel = 'opaque' | 'dim' | 'glass' | 'transparent';

interface ThemeConfigProps {
  className?: string;
}

const ThemeConfig: React.FC<ThemeConfigProps> = ({ className = '' }) => {
  const {
    theme,
    setTheme,
    setTransparencyLevel,
    setOpacity,
    setAccentColor,
    setFontScale,
    setBlurRadius,
    setDisableAnimations,
    setHighContrast,
    transparencyLevel,
    opacity,
    accentColor,
    fontScale,
    blurRadius,
    disableAnimations,
    highContrast,
  } = useThemeStore();

  const [localTheme, setLocalTheme] = useState<ThemePreset>(theme);
  const [localTransparency, setLocalTransparency] = useState<TransparencyLevel>(transparencyLevel);
  const [localOpacity, setLocalOpacity] = useState<number>(opacity);
  const [localAccentColor, setLocalAccentColor] = useState<string>(accentColor);
  const [localFontScale, setLocalFontScale] = useState<number>(fontScale);
  const [localBlurRadius, setLocalBlurRadius] = useState<number>(blurRadius);
  const [localDisableAnimations, setLocalDisableAnimations] = useState<boolean>(disableAnimations);
  const [localHighContrast, setLocalHighContrast] = useState<boolean>(highContrast);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalTheme(theme);
    setLocalTransparency(transparencyLevel);
    setLocalOpacity(opacity);
    setLocalAccentColor(accentColor);
    setLocalFontScale(fontScale);
    setLocalBlurRadius(blurRadius);
    setLocalDisableAnimations(disableAnimations);
    setLocalHighContrast(highContrast);
  }, [theme, transparencyLevel, opacity, accentColor, fontScale, blurRadius, disableAnimations, highContrast]);

  const handleThemeChange = (newTheme: ThemePreset) => {
    try {
      setTheme(newTheme);
      setLocalTheme(newTheme);
    } catch (err) {
      setError('Failed to change theme');
      console.error('Theme change error:', err);
    }
  };

  const handleTransparencyChange = (level: TransparencyLevel) => {
    try {
      setTransparencyLevel(level);
      setLocalTransparency(level);
    } catch (err) {
      setError('Failed to change transparency');
      console.error('Transparency change error:', err);
    }
  };

  const handleOpacityChange = (value: number) => {
    try {
      setOpacity(value);
      setLocalOpacity(value);
    } catch (err) {
      setError('Failed to set opacity');
      console.error('Opacity change error:', err);
    }
  };

  const handleAccentColorChange = (color: string) => {
    try {
      setAccentColor(color);
      setLocalAccentColor(color);
    } catch (err) {
      setError('Failed to set accent color');
      console.error('Accent color change error:', err);
    }
  };

  const handleFontScaleChange = (value: number) => {
    try {
      setFontScale(value);
      setLocalFontScale(value);
    } catch (err) {
      setError('Failed to set font scale');
      console.error('Font scale change error:', err);
    }
  };

  const handleBlurRadiusChange = (value: number) => {
    try {
      setBlurRadius(value);
      setLocalBlurRadius(value);
    } catch (err) {
      setError('Failed to set blur radius');
      console.error('Blur radius change error:', err);
    }
  };

  const handleDisableAnimationsChange = (checked: boolean) => {
    try {
      setDisableAnimations(checked);
      setLocalDisableAnimations(checked);
    } catch (err) {
      setError('Failed to toggle animations');
      console.error('Animations toggle error:', err);
    }
  };

  const handleHighContrastChange = (checked: boolean) => {
    try {
      setHighContrast(checked);
      setLocalHighContrast(checked);
    } catch (err) {
      setError('Failed to toggle high contrast');
      console.error('High contrast toggle error:', err);
    }
  };

  const themePresets: Record<ThemePreset, { label: string; description: string }> = {
    dark: { label: 'Dark', description: 'Standard dark theme for low light' },
    light: { label: 'Light', description: 'Light theme for bright environments' },
    midnight: { label: 'Midnight', description: 'Deep black with subtle accents' },
    forest: { label: 'Forest', description: 'Green-based theme for natural feel' },
    ocean: { label: 'Ocean', description: 'Blue-based theme for calm focus' },
  };

  const transparencyLevels: Record<TransparencyLevel, { label: string; description: string }> = {
    opaque: { label: 'Opaque', description: 'No transparency' },
    dim: { label: 'Dim', description: 'Slight transparency' },
    glass: { label: 'Glass', description: 'Frosted glass effect' },
    transparent: { label: 'Transparent', description: 'Maximum transparency' },
  };

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <CardTitle>Theme Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Label>Theme Preset</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(themePresets) as ThemePreset[]).map((preset) => (
              <Button
                key={preset}
                variant={localTheme === preset ? 'default' : 'outline'}
                onClick={() => handleThemeChange(preset)}
                className="justify-start text-left"
              >
                <div>
                  <div className="font-medium">{themePresets[preset].label}</div>
                  <div className="text-xs text-muted-foreground">{themePresets[preset].description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Transparency Level</Label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(transparencyLevels) as TransparencyLevel[]).map((level) => (
              <Button
                key={level}
                variant={localTransparency === level ? 'default' : 'outline'}
                onClick={() => handleTransparencyChange(level)}
                className="justify-start text-left"
              >
                <div>
                  <div className="font-medium">{transparencyLevels[level].label}</div>
                  <div className="text-xs text-muted-foreground">{transparencyLevels[level].description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="opacity-slider">Opacity: {Math.round(localOpacity * 100)}%</Label>
          <Slider
            id="opacity-slider"
            min={0.1}
            max={1.0}
            step={0.05}
            value={[localOpacity]}
            onValueChange={(values) => handleOpacityChange(values[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accent-color">Accent Color</Label>
          <div className="flex items-center gap-2">
            <input
              id="accent-color"
              type="color"
              value={localAccentColor}
              onChange={(e) => handleAccentColorChange(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border border-input bg-transparent p-1"
            />
            <span className="text-sm text-muted-foreground">{localAccentColor}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font-scale">Font Scale: {localFontScale.toFixed(1)}x</Label>
          <Slider
            id="font-scale"
            min={0.8}
            max={1.5}
            step={0.05}
            value={[localFontScale]}
            onValueChange={(values) => handleFontScaleChange(values[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="blur-radius">Blur Radius: {localBlurRadius}px</Label>
          <Slider
            id="blur-radius"
            min={0}
            max={20}
            step={1}
            value={[localBlurRadius]}
            onValueChange={(values) => handleBlurRadiusChange(values[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="animations-toggle">Disable Animations</Label>
            <Switch
              id="animations-toggle"
              checked={localDisableAnimations}
              onCheckedChange={handleDisableAnimationsChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="contrast-toggle">High Contrast Mode</Label>
            <Switch
              id="contrast-toggle"
              checked={localHighContrast}
              onCheckedChange={handleHighContrastChange}
            />
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <h4 className="mb-2 font-medium">Preview</h4>
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: localTheme === 'dark' || localTheme === 'midnight' ? '#1a1a1a' : '#f5f5f5',
              color: localTheme === 'dark' || localTheme === 'midnight' ? '#e5e5e5' : '#1a1a1a',
              opacity: localOpacity,
              backdropFilter: localTransparency === 'glass' ? `blur(${localBlurRadius}px)` : 'none',
              WebkitBackdropFilter: localTransparency === 'glass' ? `blur(${localBlurRadius}px)` : 'none',
              transform: localDisableAnimations ? 'none' : 'scale(1)',
              transition: localDisableAnimations ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: localAccentColor }}
              />
              <span className="font-medium" style={{ fontSize: `${localFontScale}rem` }}>
                Theme Preview
              </span>
            </div>
            <p className="text-sm" style={{ fontSize: `${localFontScale}rem` }}>
              This preview shows how the overlay will appear with your current settings.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeConfig;
```