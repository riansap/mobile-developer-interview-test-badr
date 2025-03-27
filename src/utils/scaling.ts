import { ScaledSheet, scale, verticalScale, moderateScale } from 'react-native-size-matters';

// Export core scaling functions
export { scale, verticalScale, moderateScale, ScaledSheet };

// Helper function for moderate scaling (for elements that should scale less aggressively)
export const mvs = (size: number, factor: number = 0.8) => moderateScale(size, factor);

// Helper function specifically for font sizes
export const fs = (size: number) => moderateScale(size, 1.5);
