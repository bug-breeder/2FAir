"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import OTPCard from "./otp-card";

interface OTP {
  issuer: string;
  label: string;
  secret: string;
  period: number;
  generateCode: () => string;
}

interface DraggableOTPListProps {
  otps: OTP[];
}

const DraggableOTPList: React.FC<DraggableOTPListProps> = ({ otps }) => {
  const [items, setItems] = useState(otps);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="otp-list">
        {(provided: any) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4"
          >
            {items.map((otp, index) => (
              <Draggable key={otp.label} draggableId={otp.label} index={index}>
                {(provided: any) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <OTPCard {...otp} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableOTPList;
