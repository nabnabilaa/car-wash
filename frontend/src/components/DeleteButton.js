import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './ui/button';

export const DeleteButton = ({ onClick, ...props }) => {
  return (
    <Button
      onClick={onClick}
      className="bg-red-500/20 text-red-500 hover:bg-red-500/30 h-8 px-3"
      {...props}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
};