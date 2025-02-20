
import React, { useRef } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Layers, Settings } from 'lucide-react';
import Map from '../components/Map';

const Fields = () => {
  const mapRef = useRef<{ startDrawing: () => void } | null>(null);

  const handleAddField = () => {
    mapRef.current?.startDrawing();
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
        <Map ref={mapRef} />
      </div>
    </div>
  );
};

export default Fields;
