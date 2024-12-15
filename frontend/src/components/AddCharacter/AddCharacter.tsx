import React, { useState } from 'react';
import useCharacterStore, {Character} from '@/state/characterStore';

const AddCharacter: React.FC = () => {
  const [name, setName] = useState('');
  const addCharacter = useCharacterStore((state) => state.addCharacter);

  const handleSubmit = () => {

    if (name.trim()) {

      const newCharacter: Character = {
        id: `${Date.now()}`, // Generate unique ID
        name,
        wounds: 0, // Default wounds
        strain: 0,
        maxStrain: 10,
        maxWounds: 10,
       }

      addCharacter(newCharacter);
      setName(''); // Clear the input
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter character name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleSubmit}>Add Character</button>
    </div>
  );
};

export default AddCharacter;