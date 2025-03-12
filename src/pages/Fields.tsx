
import React, { useRef, useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Layers, Settings } from 'lucide-react';
import Map from '../components/Map';
import NDVILegend from '../components/NDVILegend';
import { Field } from '../types/field';
import { supabase } from '../lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Fields = () => {
  const mapRef = useRef<{ startDrawing: () => void } | null>(null);
  const queryClient = useQueryClient();

  // Fetch fields
  const { data: fields, isLoading } = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fields')
        .select('*');
      
      if (error) throw error;
      return data as Field[];
    }
  });

  // Create field mutation
  const createField = useMutation({
    mutationFn: async (newField: Omit<Field, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('fields')
        .insert([newField])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
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
    }
  };

  return (
    <div className="h-screen w-full flex">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-50 flex items-center justify-between px-4">
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
        <Button className="gap-2" onClick={handleAddField}>
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </nav>

      {/* Main Content */}
      <div className="flex-1 pt-14">
        <Map 
          ref={mapRef} 
          onFieldCreated={handleFieldCreated}
          fields={fields}
        />
        <NDVILegend />
      </div>
    </div>
  );
};

export default Fields;
