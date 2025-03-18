import React, { useRef, useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Layers, Settings, Edit2, Save, Trash, ExternalLink } from 'lucide-react';
import Map from '../components/Map';
import { Field } from '../types/field';
import { supabase } from '../lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const LOCAL_STORAGE_KEY = 'local_fields';

const Fields = () => {
  const mapRef = useRef<{ startDrawing: () => void } | null>(null);
  const queryClient = useQueryClient();
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [localFields, setLocalFields] = useState<Field[]>([]);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedFields = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedFields) {
      try {
        const parsedFields = JSON.parse(storedFields) as Field[];
        setLocalFields(parsedFields);
      } catch (e) {
        console.error('Error parsing local fields:', e);
      }
    }
  }, []);

  const { data: fields, isLoading } = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('fields')
          .select('*');
        
        if (error) {
          console.error('Supabase error, using local storage:', error);
          setUseLocalStorage(true);
          return localFields;
        }
        
        return data as Field[];
      } catch (error) {
        console.error('Error fetching fields, using local storage:', error);
        setUseLocalStorage(true);
        return localFields;
      }
    },
    initialData: localFields
  });

  const saveToLocalStorage = (updatedFields: Field[]) => {
    console.log('Saving fields to localStorage:', updatedFields);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedFields));
    setLocalFields(updatedFields);
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const createField = useMutation({
    mutationFn: async (newField: Omit<Field, 'id' | 'created_at'>) => {
      if (useLocalStorage) {
        const localField: Field = {
          ...newField,
          id: generateId(),
          created_at: new Date().toISOString()
        };
        
        const updatedFields = [...localFields, localField];
        saveToLocalStorage(updatedFields);
        return localField;
      }
      
      const { data, error } = await supabase
        .from('fields')
        .insert([newField])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating field, using local storage:', error);
        setUseLocalStorage(true);
        
        const localField: Field = {
          ...newField,
          id: generateId(),
          created_at: new Date().toISOString()
        };
        
        const updatedFields = [...localFields, localField];
        saveToLocalStorage(updatedFields);
        return localField;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Field created successfully');
    },
    onError: (error) => {
      console.error('Mutation error creating field:', error);
      toast.error('Failed to create field');
    }
  });

  const updateField = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (useLocalStorage) {
        const fieldIndex = localFields.findIndex(field => field.id === id);
        if (fieldIndex === -1) throw new Error('Field not found');
        
        const updatedField = { 
          ...localFields[fieldIndex], 
          name,
          lastUpdated: new Date().toISOString()
        };
        
        const updatedFields = [...localFields];
        updatedFields[fieldIndex] = updatedField;
        
        console.log('Updating field in localStorage:', updatedField);
        saveToLocalStorage(updatedFields);
        
        const storedField = localStorage.getItem('selected_field');
        if (storedField) {
          const parsedField = JSON.parse(storedField) as Field;
          if (parsedField.id === id) {
            localStorage.setItem('selected_field', JSON.stringify(updatedField));
          }
        }
        
        return updatedField;
      }
      
      const { data, error } = await supabase
        .from('fields')
        .update({ 
          name,
          lastUpdated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error updating field, using local storage:', error);
        setUseLocalStorage(true);
        
        const fieldIndex = localFields.findIndex(field => field.id === id);
        if (fieldIndex === -1) throw new Error('Field not found');
        
        const updatedField = { 
          ...localFields[fieldIndex], 
          name,
          lastUpdated: new Date().toISOString()
        };
        
        const updatedFields = [...localFields];
        updatedFields[fieldIndex] = updatedField;
        
        console.log('Updating field in localStorage after Supabase error:', updatedField);
        saveToLocalStorage(updatedFields);
        
        const storedField = localStorage.getItem('selected_field');
        if (storedField) {
          const parsedField = JSON.parse(storedField) as Field;
          if (parsedField.id === id) {
            localStorage.setItem('selected_field', JSON.stringify(updatedField));
          }
        }
        
        return updatedField;
      }
      
      if (data) {
        const updatedFields = localFields.map(field => 
          field.id === id ? { ...field, ...data } : field
        );
        saveToLocalStorage(updatedFields);
        
        const storedField = localStorage.getItem('selected_field');
        if (storedField) {
          const parsedField = JSON.parse(storedField) as Field;
          if (parsedField.id === id) {
            localStorage.setItem('selected_field', JSON.stringify(data));
          }
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      setEditingFieldId(null);
      toast.success('Field name updated');
    },
    onError: (error) => {
      console.error('Error updating field name:', error);
      toast.error('Failed to update field name');
    }
  });

  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      if (useLocalStorage) {
        const updatedFields = localFields.filter(field => field.id !== id);
        console.log('Deleting field from localStorage, remaining fields:', updatedFields);
        saveToLocalStorage(updatedFields);
        
        const storedField = localStorage.getItem('selected_field');
        if (storedField) {
          const parsedField = JSON.parse(storedField) as Field;
          if (parsedField.id === id) {
            localStorage.removeItem('selected_field');
          }
        }
        
        return { id };
      }
      
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error deleting field, using local storage:', error);
        setUseLocalStorage(true);
        
        const updatedFields = localFields.filter(field => field.id !== id);
        console.log('Deleting field from localStorage after Supabase error:', updatedFields);
        saveToLocalStorage(updatedFields);
        
        const storedField = localStorage.getItem('selected_field');
        if (storedField) {
          const parsedField = JSON.parse(storedField) as Field;
          if (parsedField.id === id) {
            localStorage.removeItem('selected_field');
          }
        }
        
        return { id };
      }
      
      const updatedFields = localFields.filter(field => field.id !== id);
      saveToLocalStorage(updatedFields);
      
      const storedField = localStorage.getItem('selected_field');
      if (storedField) {
        const parsedField = JSON.parse(storedField) as Field;
        if (parsedField.id === id) {
          localStorage.removeItem('selected_field');
        }
      }
      
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Field deleted');
    },
    onError: (error) => {
      console.error('Error deleting field:', error);
      toast.error('Failed to delete field');
    }
  });

  const handleAddField = () => {
    mapRef.current?.startDrawing();
  };

  const handleFieldCreated = async (field: Omit<Field, 'id' | 'created_at'>) => {
    try {
      await createField.mutateAsync(field);
    } catch (error) {
      console.error('Error creating field:', error);
      toast.error('Failed to create field');
    }
  };

  const startEditing = (field: Field) => {
    setEditingFieldId(field.id);
    setEditingName(field.name);
  };

  const saveFieldName = async (id: string) => {
    try {
      console.log(`Saving field name for ID ${id}: ${editingName}`);
      await updateField.mutateAsync({ id, name: editingName });
    } catch (error) {
      console.error('Error updating field name:', error);
      toast.error('Failed to update field name');
    }
  };

  const handleDeleteField = async (id: string) => {
    try {
      await deleteField.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Failed to delete field');
    }
  };

  const navigateToFieldDetails = (field: Field) => {
    localStorage.setItem('selected_field', JSON.stringify(field));
    navigate(`/field-details/${field.id}`);
  };

  const displayedFields = fields || localFields;

  return (
    <div className="h-screen w-full flex flex-col">
      <nav className="fields-header">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="space-y-4 py-4">
                <h2 className="text-lg font-semibold">OneSoil AI</h2>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <Layers className="mr-2 h-4 w-4" />
                    Fields
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-semibold">Fields</h1>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleAddField}>
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </nav>

      <div className="fields-container pt-14">
        <div className="fields-sidebar">
          <h2 className="text-lg font-semibold mb-4">Your Fields</h2>
          {useLocalStorage && (
            <div className="local-storage-notice">
              Using local storage mode. Fields are saved in your browser.
            </div>
          )}
          <div className="space-y-3">
            {displayedFields?.length > 0 ? displayedFields.map((field) => (
              <div key={field.id} className="field-card">
                {editingFieldId === field.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      onClick={() => saveFieldName(field.id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer hover:text-blue-600"
                        onClick={() => navigateToFieldDetails(field)}
                      >
                        <h3 className="font-medium flex items-center">
                          {field.name}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </h3>
                        <p className="text-sm text-gray-500">
                          Area: {field.area.toFixed(2)} m²
                        </p>
                        {field.ndvi && (
                          <p className="text-sm text-gray-500">
                            NDVI: {field.ndvi.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(field)}
                          title="Edit field name"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteField(field.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete field"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <p className="text-center text-gray-500 py-4">
                No fields added yet. Click "Add Field" to create one.
              </p>
            )}
          </div>
        </div>

        <div className="fields-map">
          <Map 
            ref={mapRef} 
            onFieldCreated={handleFieldCreated}
            fields={displayedFields}
          />
        </div>
      </div>
    </div>
  );
};

export default Fields;
