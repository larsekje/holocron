import React, {ReactElement} from 'react';
import {Button, Tooltip} from '@chakra-ui/react';
import {IconProps} from "@chakra-ui/icons";

interface Props {
  text?: string;
  shortcut?: string;
  icon?: ReactElement<IconProps>;
  onClick: () => void;
  label?: string;
}

const HeadingButton = ({text, shortcut, icon, onClick, label}: Props) => {
  return (
      <Tooltip label={label} openDelay={200} hasArrow placement='top'>
        <Button height='31px' bg='#3e4249' color='white' leftIcon={icon} onClick={onClick}>
          {text} {shortcut && `[${shortcut}]`}
        </Button>
      </Tooltip>
  );
};

export default HeadingButton;
