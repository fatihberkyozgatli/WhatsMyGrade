import React, { useState } from 'react';
import { AddCourseChoiceModal } from './AddCourseChoiceModal';

interface AddCourseButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const AddCourseButton: React.FC<AddCourseButtonProps> = ({ className, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children ?? 'Add Course'}
      </button>
      <AddCourseChoiceModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};
