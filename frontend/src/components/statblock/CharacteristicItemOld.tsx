import React, {useEffect, useRef, useState} from 'react';
import {Box, Flex, Input, Text} from "@chakra-ui/react";

interface Props {
  name: string;
  value: number;
  setCurrentCharacteristic: (characteristic: string) => void;
  onEdit?: (value: number) => void;
}

const C_RING_OUTER = "#4a5260";
const C_CORE = "#2a313d";
const C_VALUE = "#c8d0d8";
const C_LABEL = "#7a828c";
const C_HOVER_RING = "#d39939";

const CharacteristicItemOld = ({name, value, setCurrentCharacteristic, onEdit}: Props) => {
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState(false);
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
    if (onEdit) {
      const n = parseInt(draft, 10);
      if (!Number.isNaN(n)) {
        onEdit(Math.max(0, Math.min(10, n)));
      }
    }
    setEditing(false);
  };

  const editable = !!onEdit;

  return (
    <Flex
      direction="column"
      align="center"
      gap={1.5}
      onMouseOver={() => setCurrentCharacteristic(name.toLowerCase())}
      onMouseLeave={() => setCurrentCharacteristic("")}
    >
      <Box position="relative" w="54px">
        <svg viewBox="0 0 80 80" width="100%" style={{display: "block"}}>
          <circle cx="40" cy="40" r="34" fill={C_RING_OUTER} />
          <circle cx="40" cy="40" r="30" fill={C_CORE} />

          {editable && hover && !editing && (
            <circle cx="40" cy="40" r="35.5" fill="none" stroke={C_HOVER_RING} strokeWidth="1.2" />
          )}

          {!editing && (
            <text
              x="40"
              y="40"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="24"
              fontWeight="900"
              fill={C_VALUE}
              fontFamily={'"Trebuchet MS", "Helvetica Neue", Arial, sans-serif'}
              style={{userSelect: "none"}}
            >
              {value}
            </text>
          )}

          {editable && (
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="transparent"
              style={{cursor: "pointer"}}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => setEditing(true)}
            />
          )}
        </svg>

        {editing && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w="50%"
          >
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
              fontWeight="extrabold"
              fontSize="xl"
              color={C_VALUE}
              p={0}
              h="auto"
            />
          </Box>
        )}
      </Box>
      <Text
        fontSize="2xs"
        fontWeight="700"
        letterSpacing="0.14em"
        color={C_LABEL}
        textTransform="uppercase"
        noOfLines={1}
      >
        {name}
      </Text>
    </Flex>
  );
};

export default CharacteristicItemOld;
