import React, {useState} from 'react';
import {
  Input, Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  useDisclosure
} from "@chakra-ui/react";
import {useDataStore} from "@/dataStore";
import {useHotkeys} from "react-hotkeys-hook";
import useDisableHotkey from "@/useDisableHotkey";
import LookupButton from "@components/lookup/LookupButton";
import LookupList from "@components/lookup/LookupList";

interface Props {

}

const Lookup = ({}: Props) => {

  // hooks
  const [searchTerm, setSearchTerm] = useState("");

  // get data
  const talents = useDataStore(state => state.talents);
  const filteredTalents = talents
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // modal controls
  const { isOpen, onOpen, onClose } = useDisclosure()
  const initialRef = React.useRef(null)
  const finalRef = React.useRef(null)

  // hotkey
  useDisableHotkey(["ctrl", "k"])
  useHotkeys("ctrl+k", () => onOpen());

  const handleOnClose = () => {
    setSearchTerm("");
    onClose();
  }

  return (
    <>

      <LookupButton onOpen={onOpen}/>

      <Modal finalFocusRef={finalRef} initialFocusRef={initialRef} isOpen={isOpen} onClose={handleOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody margin="0" padding="1">

            <Input padding="4" variant="unstyled" ref={initialRef} value={searchTerm}
                   onChange={event => setSearchTerm(event.target.value)}
                   placeholder='Gaze into the holocron'
            />

            {searchTerm.length > 0 && <LookupList talents={filteredTalents}/>}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default Lookup;
