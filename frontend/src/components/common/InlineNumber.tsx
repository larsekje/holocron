import React, {useEffect, useRef, useState} from 'react';
import {Box, Input, Text, TextProps} from '@chakra-ui/react';

interface Props extends Omit<TextProps, 'onChange'> {
  value: number;
  min?: number;
  max?: number;
  onSave: (next: number) => void;
  // Fixed cell width for both display and edit modes — prevents layout shift on click.
  cellWidth?: number | string;
}

const InlineNumber: React.FC<Props> = ({value, min, max, onSave, cellWidth = "28px", ...textProps}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => setDraft(String(value)), [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!Number.isNaN(n)) {
      let next = n;
      if (min !== undefined) next = Math.max(min, next);
      if (max !== undefined) next = Math.min(max, next);
      onSave(next);
    }
    setEditing(false);
  };

  // Both modes occupy the same fixed cell so the surrounding text doesn't shift.
  const cellSx = {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    w: cellWidth,
    minW: cellWidth,
    maxW: cellWidth,
    h: "1.4em",
    flex: "0 0 auto" as const,
    borderRadius: "sm" as const,
  };

  if (editing) {
    return (
      <Box {...cellSx} bg="#0f1114" borderWidth="1px" borderColor="#d39939">
        <Input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") {
              setDraft(String(value));
              setEditing(false);
            }
          }}
          type="number"
          variant="unstyled"
          textAlign="center"
          fontWeight="bold"
          fontSize={textProps.fontSize ?? "sm"}
          color="white"
          h="1.2em"
          w="100%"
          minW={0}
          p={0}
        />
      </Box>
    );
  }

  return (
    <Box
      {...cellSx}
      cursor="pointer"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      transition="background 0.1s ease"
      _hover={{bg: "whiteAlpha.100"}}
    >
      <Text as="b" {...textProps}>{value}</Text>
    </Box>
  );
};

export default InlineNumber;
