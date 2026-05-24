import React from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Divider,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  useClipboard,
  VStack,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import useShareStore from "@/state/shareStore";
import usePlayerDisplayStore from "@/state/playerDisplayStore";
import usePlayerSettingsStore from "@/state/playerSettingsStore";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const shareUrl = useShareStore((s) => s.shareUrl);
  const stop = useShareStore((s) => s.stop);
  const { hasCopied, onCopy } = useClipboard(shareUrl ?? "");

  // GM-pushed image
  const imageUrl = usePlayerDisplayStore((s) => s.imageUrl);
  const caption = usePlayerDisplayStore((s) => s.caption);
  const setImage = usePlayerDisplayStore((s) => s.setImage);
  const clearImage = usePlayerDisplayStore((s) => s.clear);

  // Player-view options
  const showDestiny = usePlayerSettingsStore((s) => s.showDestiny);
  const setShowDestiny = usePlayerSettingsStore((s) => s.setShowDestiny);
  const [urlDraft, setUrlDraft] = React.useState("");
  const [captionDraft, setCaptionDraft] = React.useState("");

  // Seed the draft fields from the store whenever the modal opens.
  React.useEffect(() => {
    if (isOpen) {
      setUrlDraft(imageUrl ?? "");
      setCaptionDraft(caption ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(
    window.location.hostname,
  );
  const lanPort = import.meta.env.DEV ? 8000 : 32782;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
      <ModalContent bg="gray.900" color="gray.100">
        <ModalHeader>Share with players</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color="gray.400">
              Players on the same network can open this link to follow initiative,
              the round, skill challenges, and anything you put on screen.
            </Text>

            {isLocalhost && (
              <Alert status="warning" fontSize="sm" borderRadius="md" alignItems="flex-start">
                <AlertIcon />
                <Text>
                  You opened Holocron via <b>localhost</b>, so this link won't
                  work on other devices. Reopen the app using your computer's LAN
                  IP (e.g. <code>http://192.168.x.x:{lanPort}</code>) and share
                  again.
                </Text>
              </Alert>
            )}

            <HStack>
              <Input
                value={shareUrl ?? ""}
                isReadOnly
                fontSize="sm"
                bg="gray.800"
                borderColor="gray.700"
                onFocus={(e) => e.target.select()}
              />
              <Button colorScheme="orange" onClick={onCopy} flexShrink={0}>
                {hasCopied ? "Copied" : "Copy"}
              </Button>
            </HStack>

            {/* QR for quick phone access — only meaningful on a LAN-reachable URL. */}
            {shareUrl && !isLocalhost && (
              <Center>
                <Box bg="white" p={3} borderRadius="md">
                  <QRCodeSVG value={shareUrl} size={168} level="M" />
                </Box>
              </Center>
            )}

            <Divider borderColor="gray.700" />

            {/* Player-view options */}
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.200">
                Show Destiny pool
              </Text>
              <Switch
                isChecked={showDestiny}
                onChange={(e) => setShowDestiny(e.target.checked)}
                colorScheme="orange"
              />
            </HStack>

            <Divider borderColor="gray.700" />

            {/* GM-pushed image */}
            <Box>
              <Text fontSize="xs" color="gray.400" mb={2} textTransform="uppercase" letterSpacing="0.06em">
                Show players an image
              </Text>
              <VStack align="stretch" spacing={2}>
                <Input
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="Image URL (e.g. a link to an ysalamir picture)"
                  fontSize="sm"
                  bg="gray.800"
                  borderColor="gray.700"
                />
                <Input
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  placeholder="Caption (optional)"
                  fontSize="sm"
                  bg="gray.800"
                  borderColor="gray.700"
                />
                <HStack>
                  <Button
                    size="sm"
                    colorScheme="orange"
                    flex="1"
                    isDisabled={!urlDraft.trim()}
                    onClick={() => setImage(urlDraft, captionDraft)}
                  >
                    {imageUrl ? "Update image" : "Show image"}
                  </Button>
                  {imageUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="whiteAlpha"
                      onClick={() => {
                        clearImage();
                        setUrlDraft("");
                        setCaptionDraft("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </HStack>
                {imageUrl && (
                  <Text fontSize="xs" color="green.300">
                    Showing on player screens now.
                  </Text>
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={2} onClick={onClose} color="gray.300">
            Close
          </Button>
          <Button
            variant="outline"
            colorScheme="red"
            onClick={() => {
              stop();
              onClose();
            }}
          >
            Stop sharing
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ShareModal;
