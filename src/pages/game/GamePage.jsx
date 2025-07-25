// src/pages/game/[gameId].jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import GameManager from '../../components/game/GameManager';

const GamePage = () => {
  const { gameId } = useParams();

  if (!gameId) return null;

  return <GameManager gameId={gameId} />;
};

export default GamePage;
