import { fs } from '../utils/scaling';

const Typography = {
    fontFamily: {
        regular: 'Poppins-Regular',
        medium: 'Poppins-Medium',
        bold: 'Poppins-Bold',
    },
    fontSize: {
        custom: fs,
        small: fs(12),
        medium: fs(14),
        large: fs(16),
        xlarge: fs(18),
        xxlarge: fs(24),
    },
};

export default Typography;
