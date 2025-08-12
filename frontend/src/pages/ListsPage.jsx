import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState'; // <-- 1. IMPORT EMPTY STATE
import { ListChecks } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

// Helper component for each row in the LEFT panel (List of Lists)
function ListRow({ list, onSelect, isSelected, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(list.name);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!editedName.trim() || editedName === list.name) {
      setIsEditing(false);
      return;
    }
    setIsProcessing(true);
    await onUpdate(list.id, { name: editedName });
    setIsProcessing(false);
    setIsEditing(false);
  };
  
  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    setIsProcessing(true);
    await onDelete(list.id, list.name);
    // No need to set isProcessing false here as the component will be removed
  };

  if (isEditing) {
    return (
      <div className="flex items-center p-3 rounded-lg bg-slate-700">
        <input 
          type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)}
          className="flex-1 bg-slate-600 text-white rounded px-2 py-1" autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(e); }}
        />
        <button onClick={handleSave} disabled={isProcessing} className="ml-2 text-green-400 font-bold disabled:text-slate-500">
          {isProcessing ? '...' : 'Save'}
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onSelect(list)}
      className={`group p-3 rounded-lg cursor-pointer flex justify-between items-center ${isSelected ? 'bg-cyan-500/20' : 'hover:bg-slate-700/50'}`}
    >
      <div>
        <h3 className="font-bold text-white">{list.name}</h3>
        <p className="text-sm text-slate-400">{list.items.length} items</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-2">
        <button onClick={(e) => setIsEditing(true) && e.stopPropagation()} className="p-1 text-slate-400 hover:text-white" title="Edit name">
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke="currentColor" strokeWidth="2"></path></svg>
        </button>
        <button onClick={handleDeleteClick} className="p-1 text-slate-400 hover:text-red-500" title="Delete list">
          {isProcessing ? '...' : <svg width="16" height="16" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" strokeWidth="2"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" strokeWidth="2"></path></svg>}
        </button>
      </div>
    </div>
  );
}

// Helper component for each item in the RIGHT panel (List Items)
function ListItem({ item, onUpdate, onDelete }) {
    // ... (This component will be created in the next step to add edit functionality here too)
    // For now, we keep the simple version.
    return (
        <li className="group flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
            <div className="flex items-center">
              <input type="checkbox" checked={item.is_completed} onChange={() => onUpdate(item.id, { is_completed: !item.is_completed })} className="h-5 w-5 mr-3 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 rounded cursor-pointer"/>
              <div>
                <span className={`text-white ${item.is_completed ? 'line-through text-slate-500' : ''}`}>{item.name}</span>
                {item.quantity && <span className={`text-slate-400 text-sm ml-2 ${item.is_completed ? 'line-through' : ''}`}>({item.quantity})</span>}
              </div>
            </div>
            <button onClick={() => onDelete(item.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Item">
              <svg xmlns="http://www.w.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </li>
    );
}


function ListsPage() {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [newItemText, setNewItemText] = useState('');
  const [newListName, setNewListName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  // --- Data Fetching ---
  const fetchLists = async () => {
    try {
      const response = await apiClient.get('/lists/');
      setLists(response.data);
    } catch (error) {
      console.error("Failed to fetch lists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);
  
  const fetchListDetails = async (listId) => {
    try {
      const response = await apiClient.get(`/lists/${listId}/`);
      setSelectedList(response.data);
    } catch (error) {
      console.error("Failed to fetch list details:", error);
    }
  };

  const handleSelectList = (list) => {
    fetchListDetails(list.id);
  };

 const handleCreateList = async (event) => {
    event.preventDefault();
    if (!newListName.trim()) return;
    setIsCreatingList(true);
    try {
      await apiClient.post('/lists/', { name: newListName });
      setNewListName('');
      toast.success(`List "${newListName}" created!`);
      fetchLists();
    } catch (error) {
      toast.error("Failed to create list.");
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleSmartAdd = async (event) => {
    event.preventDefault();
    if (!newItemText.trim() || !selectedList) return;
    setIsAddingItem(true);
    try {
      const response = await apiClient.post(`/lists/${selectedList.id}/add_items/`, { text: newItemText });
      setNewItemText('');
      toast.success(response.data.status);
      fetchListDetails(selectedList.id);
    } catch (error) {
      toast.error("Failed to add items.");
    } finally {
      setIsAddingItem(false);
    }
  };
  const handleUpdateItem = async (itemId, updatedData) => {
    try {
      const response = await apiClient.patch(`/lists/items/${itemId}/`, updatedData);
      const updatedItems = selectedList.items.map(i => i.id === itemId ? response.data : i);
      setSelectedList({...selectedList, items: updatedItems});
    } catch (error) {
      toast.error("Failed to update item.");
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      await apiClient.patch(`/lists/items/${item.id}/`, { is_completed: !item.is_completed });
      fetchListDetails(selectedList.id);
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDeleteItemRequest = async (itemId) => {
    setConfirmingDelete({ type: 'item', id: itemId });
  };

   const handleUpdateList = async (listId, updatedData) => {
    await apiClient.put(`/lists/${listId}/`, updatedData);
    toast.success("List renamed!");
    fetchLists();
  };

  const handleDeleteListRequest = (listId, listName) => {
    setConfirmingDelete({ type: 'list', id: listId, name: listName });
  };
  
  // --- NEW: This function runs when the user clicks "Confirm" ---
  const handleConfirmDelete = async () => {
    if (!confirmingDelete) return;

    const { type, id, name } = confirmingDelete;
    
    try {
      if (type === 'list') {
        await apiClient.delete(`/lists/${id}/`);
        toast.success(`List "${name}" deleted.`);
        fetchLists();
        if (selectedList?.id === id) setSelectedList(null);
      } else if (type === 'item') {
        await apiClient.delete(`/lists/items/${id}/`);
        toast.success("Item deleted.");
        fetchListDetails(selectedList.id); // Refresh the items in the current list
      }
    } catch (error) {
      toast.error(`Failed to delete ${type}.`);
      console.error(`Failed to delete ${type}:`, error);
    } finally {
      setConfirmingDelete(null); // Close the modal
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-8 text-white">My Lists</h2>
      <div className="flex gap-8 h-[calc(100vh-150px)]">
        
        {/* --- LEFT COLUMN: List of Lists --- */}
        <div className="w-1/3 bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 flex flex-col">
          <form onSubmit={handleCreateList} className="flex items-center gap-2 mb-4">
            <input type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="Create a new list..." className="flex-1 px-3 py-2 bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold p-2 rounded-lg">+</button>
          </form>
          <div className="overflow-y-auto space-y-2 mt-4 pr-2">
            {isLoading ? (
              <p>Loading...</p>
            ) : lists.length > 0 ? (
              lists.map(list => (
                <ListRow 
                  key={list.id}
                  list={list}
                  onSelect={handleSelectList}
                  isSelected={selectedList?.id === list.id}
                  onUpdate={handleUpdateList}
                  onDelete={handleDeleteListRequest}
                />
              ))
            ) : (
              // --- 3. USE THE EMPTY STATE COMPONENT ---
              <EmptyState 
                icon={ListChecks}
                title="No Lists Yet"
                message="Create your first list using the form above."
              />
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: Selected List's Details --- */}
        <div className="w-2/3 bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 overflow-y-auto">
          {selectedList ? (
            <>
              <h3 className="font-bold text-2xl mb-4 text-white">{selectedList.name}</h3>
              <form onSubmit={handleSmartAdd} className="flex items-center gap-4 mb-6">
                <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Add items (e.g., milk 2 litres, eggs)" className="flex-1 px-4 py-2 bg-slate-700 rounded-lg"/>
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg">Add</button>
              </form>
              <ul>
                {selectedList.items.map(item => (
                  <li key={item.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
                    <div className="flex items-center">
                      <input type="checkbox" checked={item.is_completed} onChange={() => handleToggleComplete(item)} className="h-5 w-5 mr-3 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"/>
                      <div>
                        <span className={`text-white ${item.is_completed ? 'line-through text-slate-500' : ''}`}>{item.name}</span>
                        {item.quantity && <span className={`text-slate-400 text-sm ml-2 ${item.is_completed ? 'line-through' : ''}`}>({item.quantity})</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteItemRequest(item.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-full" title="Delete Item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <EmptyState 
                icon={ListChecks}
                title="Select a List"
                message="Select a list on the left to view its items, or create a new one."
              />
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={!!confirmingDelete}
        onClose={() => setConfirmingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${confirmingDelete?.type || ''}`}
        message={`Are you sure you want to permanently delete this ${confirmingDelete?.type}? This action cannot be undone.`}
      />
    </>
  );
}

export default ListsPage;