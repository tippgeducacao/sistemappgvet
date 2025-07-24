import React, { useState } from 'react';
import { Tv } from 'lucide-react';

const TestTVButton = () => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    console.log('🚨 TESTE: Botão clicado!');
    setClicked(true);
    alert('Botão funcionando!');
  };

  return (
    <div className="p-4 border border-red-500 bg-red-100">
      <h3 className="text-red-600 font-bold mb-2">TESTE - Botão de TV</h3>
      <button
        onClick={handleClick}
        className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600"
      >
        <Tv className="h-5 w-5" />
        {clicked ? ' CLICADO!' : ' Clique aqui'}
      </button>
    </div>
  );
};

export default TestTVButton;