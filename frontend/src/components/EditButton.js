import React from 'react';
import { Pencil } from 'lucide-react';
import { Button } from './ui/button';

export const EditButton = ({ onClick, ...props }) => {
  return (
    <Button
      onClick={onClick}
      className="bg-zinc-800 text-white hover:bg-zinc-700 h-8 px-3"
      {...props}
    >
      <Pencil className="w-4 h-4" />
    </Button>
  );
};