import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import { ListChecks } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

// Helper component for each row in the LEFT panel (List of Lists)
function ListRow({ list, onSelect, isSelected, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(list.name);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!editedName.trim() || editedName === list.name) {
      setIsEditing(false);
      return;
    }
    await onUpdate(list.id, { name: editedName });
    setIsEditing(false);
  };
  
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(list.id, list.name);
  };

  if (isEditing) {
    return (
      <div className="flex items-center p-3 rounded-lg bg-slate-700">
        <input 
          type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)}
          className="flex-1 bg-slate-600 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSave(e); }}
          onBlur={handleSave}
        />
      </div>
    );
  }

  return (
    <div 
      onClick={() => onSelect(list)}
      className={`group p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-700/50'}`}
    >
      <div>
        <h3 className="font-bold text-white">{list.name}</h3>
        <p className="text-sm text-slate-400">{list.items.length} items</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button onClick={handleEditClick} className="p-1 text-slate-400 hover:text-white" title="Edit name"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke="currentColor" strokeWidth="2"></path></svg></button>
        <button onClick={handleDeleteClick} className="p-1 text-slate-400 hover:text-red-500" title="Delete list"><svg width="16" height="16" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" strokeWidth="2"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" strokeWidth="2"></path></svg></button>
      </div>
    </div>
  );
}

// Helper component for each item in the RIGHT panel (List Items)
function ListItem({ item, onUpdate, onDelete, isShoppingMode, price, onPriceChange, onPriceSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedQuantity, setEditedQuantity] = useState(item.quantity || '');

  const handleSave = async () => {
    if (editedName.trim() === '') return;
    await onUpdate(item.id, { 
      name: editedName, 
      quantity: editedQuantity 
    });
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    onUpdate(item.id, { is_completed: !item.is_completed });
  };

  if (isEditing) {
    return (
      <li className="flex items-center gap-2 py-2 border-b border-slate-700">
        <input type="checkbox" checked={item.is_completed} readOnly className="h-5 w-5"/>
        <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="flex-grow bg-slate-600 text-white rounded px-2 py-1" autoFocus/>
        <input type="text" value={editedQuantity} onChange={(e) => setEditedQuantity(e.target.value)} placeholder="Quantity" className="w-28 bg-slate-600 text-white rounded px-2 py-1"/>
        <button onClick={handleSave} className="p-2 text-green-400 font-bold">Save</button>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
      <div className="flex items-center">
        <input type="checkbox" checked={item.is_completed} onChange={handleToggleComplete} className="h-5 w-5 mr-3 cursor-pointer"/>
        <div>
          <span className={`text-white ${item.is_completed ? 'line-through text-slate-500' : ''}`}>{item.name}</span>
          {item.quantity && <span className={`text-slate-400 text-sm ml-2 ${item.is_completed ? 'line-through' : ''}`}>({item.quantity})</span>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {isShoppingMode && (
          <div className="flex items-center">
            <span className="text-slate-400 mr-1">₹</span>
            <input type="number" placeholder="0.00" value={price || ''} onChange={(e) => onPriceChange(item.id, e.target.value)} onBlur={() => onPriceSave(item.id)} className="w-24 bg-slate-700 text-white rounded px-2 py-1 text-right"/>
          </div>
        )}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 hover:text-white" title="Edit Item"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke="currentColor" strokeWidth="2"></path></svg></button>
          <button onClick={() => onDelete(item.id, item.name)} className="p-1 text-slate-400 hover:text-red-500" title="Delete Item"><svg width="16" height="16" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" strokeWidth="2"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" strokeWidth="2"></path></svg></button>
        </div>
      </div>
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
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [itemPrices, setItemPrices] = useState({});
  const navigate = useNavigate();
  const [confirmationState, setConfirmationState] = useState({ isOpen: false });
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
      // Initialize prices from fetched data
      const initialPrices = {};
      response.data.items.forEach(item => {
        if (item.price) {
          initialPrices[item.id] = item.price;
        }
      });
      setItemPrices(initialPrices);
    } catch (error) { console.error("Failed to fetch list details:", error); }
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
  // Removed duplicate handleUpdateItem function declaration

  const handleToggleComplete = async (item) => {
    try {
      await apiClient.patch(`/lists/items/${item.id}/`, { is_completed: !item.is_completed });
      fetchListDetails(selectedList.id);
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDeleteItemRequest = (itemId, itemName) => {
    setConfirmationState({
      isOpen: true,
      title: 'Delete Item',
      message: `Are you sure you want to permanently delete the item "${itemName}"?`,
      onConfirm: () => handleDeleteItem(itemId),
    });
  };

   const handleUpdateList = async (listId, updatedData) => {
    await apiClient.put(`/lists/${listId}/`, updatedData);
    toast.success("List renamed!");
    fetchLists();
  };

  const handleDeleteListRequest = (listId, listName) => {
    setConfirmationState({
      isOpen: true,
      title: 'Delete List',
      message: `Are you sure you want to permanently delete the list "${listName}"? This will delete all its items.`,
      onConfirm: () => handleDeleteList(listId, listName),
    });
  };
  
  // --- NEW: This function runs when the user clicks "Confirm" ---
  const handleConfirmDelete = async () => {
    if (!confirmationState.isOpen) return;

    const { type, id, name } = confirmationState;

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

   const handleUpdateItem = async (itemId, updatedData) => {
    try {
      const response = await apiClient.patch(`/lists/items/${itemId}/`, updatedData);
      const updatedItems = selectedList.items.map(i => i.id === itemId ? response.data : i);
      setSelectedList({...selectedList, items: updatedItems});
      if (updatedData.name) { // Only show toast for name/quantity edits
          toast.success("Item updated!");
      }
    } catch (error) {
      toast.error("Failed to update item.");
      console.error("Failed to update item:", error);
    }
  };

  const handlePriceChange = (itemId, price) => {
    setItemPrices({ ...itemPrices, [itemId]: price });
  };

  const handlePriceUpdate = async (itemId) => {
    const price = itemPrices[itemId];
    if (!price || price < 0) return; // Don't save empty/negative prices
    try {
      await apiClient.patch(`/lists/items/${itemId}/`, { price: price });
      toast.success("Price saved!");
    } catch (error) {
      toast.error("Failed to save price.");
    }
  };

  const shoppingTotal = useMemo(() => {
    return Object.values(itemPrices).reduce((total, price) => total + parseFloat(price || 0), 0);
  }, [itemPrices]);
const handleDeleteList = async (listId, listName) => {
      try {
        await apiClient.delete(`/lists/${listId}/`);
        toast.success(`List "${listName}" deleted.`);
        fetchLists();
        if (selectedList?.id === listId) setSelectedList(null);
      } catch (error) {
        toast.error("Failed to delete list.");
      }
  };

  const handleDeleteItem = async (itemId) => {
      try {
        await apiClient.delete(`/lists/items/${itemId}/`);
        toast.success("Item deleted.");
        fetchListDetails(selectedList.id);
      } catch (error) {
        toast.error("Failed to delete item.");
      }
  };

  const handleFinishShopping = async () => {
    if (shoppingTotal <= 0) {
      setIsShoppingMode(false);
      return;
    }

    setConfirmationState({
        isOpen: true,
        title: "Log Expense",
        message: `Your total is ₹${shoppingTotal.toFixed(2)}. Log this as a new expense?`,
        onConfirm: logShoppingExpense, // <-- Points to the correct function
    });
  };

  const logShoppingExpense = async () => {
  try {
      // --- NEW: Create a more descriptive sentence for the AI ---
      const expenseText = `Shopping for '${selectedList.name}' list, total was ${shoppingTotal.toFixed(2)}`;

      // --- UPDATED: Send ONLY the text field ---
      await apiClient.post('/expenses/', { text: expenseText });

      toast.success("Expense logged from your shopping trip!");
      setIsShoppingMode(false);
    } catch (error) {
      toast.error("Failed to log expense.");
    }
};

  return (
    <>
      <h2 className="text-3xl font-bold mb-8 text-white">My Lists</h2>
      <div className="flex gap-8 h-[calc(100vh-150px)]">
        <div className="w-1/3 bg-black/20 backdrop-blur-lg p-6 rounded-lg border border-white/10 flex flex-col">
          <form onSubmit={handleCreateList} className="flex items-center gap-2 mb-4">
            <input type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="Create a new list..." className="flex-1 px-3 py-2 bg-slate-700 rounded-lg"/>
            <button type="submit" disabled={isCreatingList} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold p-2 rounded-lg">
              {isCreatingList ? '...' : '+'}
            </button>
          </form>
          <div className="overflow-y-auto space-y-2 mt-4 pr-2">
            {isLoading ? <p>Loading...</p> : lists.length > 0 ? (
              lists.map(list => ( <ListRow key={list.id} list={list} onSelect={handleSelectList} isSelected={selectedList?.id === list.id} onUpdate={handleUpdateList} onDelete={handleDeleteListRequest} /> ))
            ) : ( <EmptyState icon={ListChecks} title="No Lists Yet" message="Create your first list." /> )}
          </div>
        </div>
        <div className="w-2/3 bg-black/20 backdrop-blur-lg flex flex-col border border-white/10 rounded-lg">
          {selectedList ? (
            <div className="flex flex-col h-full">
              <div className="p-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-2xl text-white">{selectedList.name}</h3>
                    <button onClick={() => setIsShoppingMode(!isShoppingMode)} className={`font-bold py-2 px-4 rounded-lg ${isShoppingMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'} text-white text-sm`}>
                      {isShoppingMode ? 'Exit Shopping Mode' : 'Start Shopping'}
                    </button>
                </div>
                <form onSubmit={handleSmartAdd} className="flex items-center gap-4 mt-4">
                  <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Add items (e.g., milk 2 litres, eggs)" className="flex-1 px-4 py-2 bg-slate-700 rounded-lg"/>
                  <button type="submit" disabled={isAddingItem} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg">
                    {isAddingItem ? 'Adding...' : 'Add'}
                  </button>
                </form>
              </div>
              <ul className="overflow-y-auto px-6 flex-grow">
                {selectedList.items.map(item => (
                  <ListItem key={item.id} item={item} onUpdate={handleUpdateItem} onDelete={handleDeleteItemRequest}
                    isShoppingMode={isShoppingMode} price={itemPrices[item.id]}
                    onPriceChange={handlePriceChange} onPriceSave={handlePriceUpdate}
                  />
                ))}
              </ul>
              {isShoppingMode && (
                <div className="mt-auto bg-black/30 p-4 border-t border-white/10 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Shopping Total: ₹{shoppingTotal.toFixed(2)}</h3>
                  <button onClick={handleFinishShopping} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg">
                    Finish & Log Expense
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <EmptyState icon={ListChecks} title="Select a List" message="Select a list on the left to view its items."/>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmationState.isOpen}
        onClose={() => setConfirmationState({ isOpen: false })}
        onConfirm={() => {
            if (confirmationState.onConfirm) confirmationState.onConfirm();
            setConfirmationState({ isOpen: false });
        }}
        title={confirmationState.title || "Confirm Action"}
        message={confirmationState.message || "Are you sure?"}
      />
    </>
  );
}

export default ListsPage;