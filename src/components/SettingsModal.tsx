import React, { useState, useEffect } from 'react';
import { RadioStation } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: RadioStation[];
  onAddStation: (station: Omit<RadioStation, 'id'>) => void;
  onEditStation: (station: RadioStation) => void;
  onDeleteStation: (id: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  stations,
  onAddStation,
  onEditStation,
  onDeleteStation,
}: SettingsModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    genre: '',
  });

  useEffect(() => {
    if (!isOpen) {
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', url: '', description: '', genre: '' });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return;

    if (editingId) {
      onEditStation({ id: editingId, ...formData });
    } else {
      onAddStation(formData);
    }

    setFormData({ name: '', url: '', description: '', genre: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (station: RadioStation) => {
    setEditingId(station.id);
    setFormData({
      name: station.name,
      url: station.url,
      description: station.description,
      genre: station.genre || '',
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', url: '', description: '', genre: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-cog text-purple-400"></i>
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* Add/Edit Form */}
          {isAdding ? (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? 'Editar Rádio' : 'Adicionar Nova Rádio'}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome da Rádio *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Rádio FM 99.5"
                  className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL do Stream *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://stream.exemplo.com/radio"
                  className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da rádio..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Gênero
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  placeholder="Ex: Pop, Rock, Jazz..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25"
                >
                  <i className="fas fa-save mr-2"></i>
                  {editingId ? 'Salvar' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full mb-6 px-4 py-3 rounded-xl border-2 border-dashed border-gray-600 hover:border-purple-500 text-gray-400 hover:text-purple-400 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Adicionar Nova Rádio
            </button>
          )}

          {/* Station List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Rádios Salvas ({stations.length})
            </h3>

            {stations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-radio text-4xl mb-3 opacity-50"></i>
                <p>Nenhuma rádio adicionada ainda</p>
                <p className="text-sm mt-1">Clique no botão acima para adicionar</p>
              </div>
            ) : (
              stations.map((station) => (
                <div
                  key={station.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-all group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <i className="fas fa-broadcast-tower text-white text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{station.name}</p>
                    <p className="text-gray-400 text-sm truncate">{station.description || station.url}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(station)}
                      className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition-all"
                      title="Editar"
                    >
                      <i className="fas fa-edit text-sm"></i>
                    </button>
                    <button
                      onClick={() => onDeleteStation(station.id)}
                      className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-all"
                      title="Excluir"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
