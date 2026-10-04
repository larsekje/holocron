import React, { useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Heading,
  Input,
  List,
  ListItem,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { SetPiece, SetPieceDraft, emptyDraft, toDraft } from "@/setPiece";
import { useSetPieceStore } from "@/setPieceStore";
import SetPieceAuthorForm from "./SetPieceAuthorForm";
import DropInModal from "./DropInModal";

type Mode = "browse" | "edit" | "new";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TIER_COLOR: Record<string, string> = { easy: "green", medium: "yellow", hard: "red" };

const SetPieceDrawer = ({ isOpen, onClose }: Props) => {
  const pieces = useSetPieceStore(state => state.pieces);
  const loading = useSetPieceStore(state => state.loading);
  const error = useSetPieceStore(state => state.error);
  const loadAll = useSetPieceStore(state => state.loadAll);
  const createPiece = useSetPieceStore(state => state.create);
  const updatePiece = useSetPieceStore(state => state.update);
  const removePiece = useSetPieceStore(state => state.remove);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("browse");
  const [draft, setDraft] = useState<SetPieceDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  const toast = useToast();
  const dropIn = useDisclosure();

  const selected = pieces.find(p => p.id === selectedId) || null;

  useEffect(() => {
    if (isOpen && pieces.length === 0 && !loading) {
      loadAll();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) {
      setMode("browse");
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredPieces = pieces.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startNew = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setMode("new");
  };

  const startEdit = (piece: SetPiece) => {
    setDraft(toDraft(piece));
    setEditingId(piece.id);
    setMode("edit");
  };

  const startFork = (piece: SetPiece) => {
    const forked = toDraft(piece);
    forked.name = `${piece.name} (copy)`;
    setDraft(forked);
    setEditingId(null);
    setMode("new");
    toast({ status: "info", title: "Forked to new user set piece", description: "Save to persist your copy." });
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast({ status: "error", title: "Name required" });
      return;
    }
    setSaving(true);
    try {
      let saved: SetPiece;
      if (mode === "edit" && editingId) {
        saved = await updatePiece(editingId, draft);
      } else {
        saved = await createPiece(draft);
      }
      toast({ status: "success", title: "Saved", description: saved.name });
      setSelectedId(saved.id);
      setMode("browse");
    } catch (err) {
      toast({ status: "error", title: "Save failed", description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!draft.name.trim()) {
      toast({ status: "error", title: "Name required" });
      return;
    }
    setSaving(true);
    try {
      const saved = await createPiece(draft);
      toast({ status: "success", title: "Saved as new", description: saved.name });
      setSelectedId(saved.id);
      setMode("browse");
    } catch (err) {
      toast({ status: "error", title: "Save failed", description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.source !== "user") return;
    if (!window.confirm(`Delete '${selected.name}'? This can't be undone.`)) return;
    try {
      await removePiece(selected.id);
      setSelectedId(null);
      toast({ status: "success", title: "Deleted" });
    } catch (err) {
      toast({ status: "error", title: "Delete failed", description: (err as Error).message });
    }
  };

  const renderBrowse = () => (
    <HStack align="stretch" height="100%" spacing={3}>
      <Box width="40%" minWidth="200px" overflowY="auto">
        <Stack spacing={2}>
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            size="sm"
          />
          <Button leftIcon={<AddIcon/>} size="sm" colorScheme="green" onClick={startNew}>
            New set piece
          </Button>
          {loading && <Spinner alignSelf="center"/>}
          {error && <Alert status="error" fontSize="sm"><AlertIcon/>{error}</Alert>}
          <List spacing={1}>
            {filteredPieces.map(piece => {
              const isSelected = piece.id === selectedId;
              return (
                <ListItem key={piece.id}>
                  <Button
                    width="100%"
                    justifyContent="flex-start"
                    size="sm"
                    variant={isSelected ? "solid" : "outline"}
                    colorScheme={isSelected ? "blue" : "gray"}
                    onClick={() => setSelectedId(piece.id)}
                    whiteSpace="normal"
                    textAlign="left"
                    height="auto"
                    paddingY={2}
                  >
                    <Stack spacing={0} align="flex-start" width="100%">
                      <Text fontSize="sm">{piece.name}</Text>
                      <HStack spacing={1}>
                        <Badge colorScheme={TIER_COLOR[piece.tier]} fontSize="0.6em">{piece.tier}</Badge>
                        <Badge colorScheme={piece.source === "library" ? "blue" : "purple"} fontSize="0.6em">
                          {piece.source}
                        </Badge>
                      </HStack>
                    </Stack>
                  </Button>
                </ListItem>
              );
            })}
            {!loading && filteredPieces.length === 0 && (
              <Text fontSize="sm" color="gray.500" textAlign="center">No matches.</Text>
            )}
          </List>
        </Stack>
      </Box>
      <Box flex="1" overflowY="auto" paddingLeft={3} borderLeft="1px solid #e2e8f0">
        {selected ? (
          <Stack spacing={3}>
            <Heading size="md">{selected.name}</Heading>
            <HStack>
              <Badge colorScheme={TIER_COLOR[selected.tier]}>{selected.tier}</Badge>
              <Badge colorScheme={selected.source === "library" ? "blue" : "purple"}>
                {selected.source}
              </Badge>
            </HStack>
            <HStack flexWrap="wrap">
              <Button colorScheme="green" size="sm" onClick={dropIn.onOpen}>
                Use
              </Button>
              {selected.source === "user" && (
                <>
                  <Button leftIcon={<EditIcon/>} size="sm" onClick={() => startEdit(selected)}>
                    Edit
                  </Button>
                  <Button leftIcon={<DeleteIcon/>} size="sm" colorScheme="red" variant="outline" onClick={handleDelete}>
                    Delete
                  </Button>
                </>
              )}
              {selected.source === "library" && (
                <Button size="sm" onClick={() => startFork(selected)}>
                  Fork to edit
                </Button>
              )}
            </HStack>
            <PreviewSection label="Scene" text={selected.scene}/>
            <PreviewSection label="Battlefield" text={selected.battlefield}/>
            <PreviewSection label="Tactics" text={selected.tactics}/>
            <PreviewSection label="Suggested adversaries" text={selected.suggested_adversaries}/>
            <PreviewSection label="Quick-add" text={
              selected.quick_add.length
                ? selected.quick_add.map(e => `${e.count} × ${e.ref}`).join("\n")
                : ""
            }/>
            <PreviewSection label="Skill uses" text={selected.skill_uses}/>
            <PreviewSection label="Dice spends" text={selected.dice_menu}/>
            <PreviewSection label="GM notes" text={selected.gm_notes}/>
          </Stack>
        ) : (
          <Text color="gray.500">Select a set piece on the left.</Text>
        )}
      </Box>
    </HStack>
  );

  const renderAuthor = () => (
    <Stack spacing={3}>
      <Heading size="md">
        {mode === "edit" ? `Edit: ${draft.name || "(unnamed)"}` : "New set piece"}
      </Heading>
      <SetPieceAuthorForm draft={draft} onChange={setDraft}/>
    </Stack>
  );

  return (
    <>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
        <DrawerOverlay/>
        <DrawerContent>
          <DrawerCloseButton/>
          <DrawerHeader>Set Pieces</DrawerHeader>
          <DrawerBody>
            {mode === "browse" ? renderBrowse() : renderAuthor()}
          </DrawerBody>
          <DrawerFooter>
            {mode === "browse" ? (
              <Button variant="outline" onClick={onClose}>Close</Button>
            ) : (
              <HStack>
                <Button variant="ghost" onClick={() => setMode("browse")}>Cancel</Button>
                {mode === "edit" && (
                  <Button variant="outline" onClick={handleSaveAsNew} isLoading={saving}>
                    Save as new
                  </Button>
                )}
                <Button colorScheme="blue" onClick={handleSave} isLoading={saving}>
                  Save
                </Button>
              </HStack>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <DropInModal isOpen={dropIn.isOpen} onClose={dropIn.onClose} piece={selected}/>
    </>
  );
};

interface PreviewSectionProps {
  label: string;
  text: string;
}

const PreviewSection = ({ label, text }: PreviewSectionProps) => {
  if (!text) return null;
  return (
    <Box>
      <Text fontSize="xs" textTransform="uppercase" color="gray.500" fontWeight="bold">{label}</Text>
      <Text whiteSpace="pre-wrap" fontSize="sm">{text}</Text>
    </Box>
  );
};

export default SetPieceDrawer;
