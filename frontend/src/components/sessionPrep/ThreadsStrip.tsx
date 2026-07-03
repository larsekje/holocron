import React, { useState } from 'react';
import { Box, HStack, Input, Text, VStack } from '@chakra-ui/react';
import useSessionPrepStore from '@/state/sessionPrepStore';

/**
 * ThreadsStrip — the night's open loose ends, pinned near the top of the play
 * surface. This is the anti-railroad structure: instead of a plot to protect,
 * the GM keeps a visible list of established threads to weave player choices
 * back into. Two interactions only: add in one keystroke, tap ✓ to resolve
 * (tap again to un-resolve — resolving is reversible, deleting is explicit).
 */
const ThreadsStrip: React.FC = () => {
  const threads = useSessionPrepStore((s) => s.threads);
  const addThread = useSessionPrepStore((s) => s.addThread);
  const toggleThread = useSessionPrepStore((s) => s.toggleThread);
  const removeThread = useSessionPrepStore((s) => s.removeThread);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    addThread(text);
    setDraft('');
  };

  return (
    <Box>
      <Text fontSize="2xs" color="whiteAlpha.500" letterSpacing="0.16em" textTransform="uppercase" fontWeight="bold" mb={1}>
        Threads
      </Text>
      <VStack align="stretch" spacing="3px">
        {threads.map((t) => (
          <HStack
            key={t.id}
            role="group"
            spacing={1.5}
            px={1.5}
            py="2px"
            bg="#1f2225"
            borderWidth="1px"
            borderColor="whiteAlpha.150"
            borderRadius="md"
            opacity={t.resolved ? 0.38 : 1}
          >
            <Text color="#d39939" fontSize="10px" flexShrink={0}>◈</Text>
            <Text
              color="whiteAlpha.800"
              fontSize="2xs"
              flex="1"
              lineHeight="1.4"
              textDecoration={t.resolved ? 'line-through' : undefined}
            >
              {t.text}
            </Text>
            <Box
              as="button"
              color="whiteAlpha.400"
              fontSize="11px"
              px={0.5}
              opacity={0}
              _groupHover={{ opacity: 1 }}
              _hover={{ color: '#9fd4b4' }}
              transition="opacity 120ms"
              title={t.resolved ? 'Reopen' : 'Resolve'}
              onClick={() => toggleThread(t.id)}
            >
              ✓
            </Box>
            {t.resolved && (
              <Box
                as="button"
                color="whiteAlpha.400"
                fontSize="11px"
                px={0.5}
                opacity={0}
                _groupHover={{ opacity: 1 }}
                _hover={{ color: '#e08080' }}
                transition="opacity 120ms"
                title="Delete thread"
                onClick={() => removeThread(t.id)}
              >
                ✕
              </Box>
            )}
          </HStack>
        ))}
        <HStack spacing={1.5} px={1}>
          <Text color="whiteAlpha.400" fontSize="2xs">+</Text>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="new thread… ↵"
            size="xs"
            variant="unstyled"
            color="whiteAlpha.900"
            fontSize="2xs"
            borderBottom="1px dashed"
            borderColor="whiteAlpha.300"
            borderRadius={0}
            _placeholder={{ color: 'whiteAlpha.400', fontStyle: 'italic' }}
          />
        </HStack>
      </VStack>
    </Box>
  );
};

export default ThreadsStrip;
