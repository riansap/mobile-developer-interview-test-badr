import React from 'react';
import Colors from '../constants/colors';
import {mvs} from '../utils/scaling';

// Import SVG icons
import AddIcon from '../assets/icons/add-icons.svg';
import BackIcon from '../assets/icons/back-icons.svg';
import DeleteIcon from '../assets/icons/delete-icons.svg';
import DropdownIcon from '../assets/icons/chevron-down-icons.svg';

// Export all icons for direct use
export {AddIcon, BackIcon, DeleteIcon, DropdownIcon};

// For backward compatibility
interface IconProps {
  name: 'add' | 'back' | 'delete' | 'dropdown';
}

const Icons: React.FC<IconProps> = ({name}) => {
  switch (name) {
    case 'add':
      return (
        <AddIcon
          width={mvs(14)}
          height={mvs(14)}
          fill={Colors.secondaryLight}
        />
      );
    case 'back':
      return <BackIcon width={mvs(17)} height={mvs(11)} fill={Colors.danger} />;
    case 'delete':
      return (
        <DeleteIcon width={mvs(14)} height={mvs(18)} fill={Colors.danger} />
      );
    case 'dropdown':
      return (
        <DropdownIcon
          width={mvs(11)}
          height={mvs(6.5)}
          fill={Colors.primaryDark}
        />
      );
    // Add more cases as needed
    default:
      return null;
  }
};

export default Icons;
