import React from "react";
import { IconButton, Tooltip, useDisclosure } from "@chakra-ui/react";
import { FiShare2 } from "react-icons/fi";
import useShareStore from "@/state/shareStore";
import ShareModal from "./ShareModal";

/**
 * Header button that starts (or re-opens) sharing the encounter with players and
 * surfaces the link in a modal. Tints gold while sharing is active.
 */
const ShareButton: React.FC = () => {
  const isSharing = useShareStore((s) => s.isSharing);
  const start = useShareStore((s) => s.start);
  const modal = useDisclosure();

  const handleClick = () => {
    if (!isSharing) start();
    modal.onOpen();
  };

  return (
    <>
      <Tooltip
        label={isSharing ? "Sharing with players" : "Share with players"}
        placement="bottom"
        hasArrow
        openDelay={300}
      >
        <IconButton
          size="sm"
          variant="ghost"
          aria-label="Share with players"
          icon={<FiShare2 size={18} />}
          color={isSharing ? "#d39939" : "whiteAlpha.700"}
          _hover={{ color: isSharing ? "#e0a84a" : "whiteAlpha.900" }}
          onClick={handleClick}
        />
      </Tooltip>
      <ShareModal isOpen={modal.isOpen} onClose={modal.onClose} />
    </>
  );
};

export default ShareButton;
