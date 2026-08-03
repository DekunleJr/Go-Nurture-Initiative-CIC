"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  capacity: number;
  description: string;
}

interface VenuesTabProps {
  venues: Venue[];
  onCreateVenue: (venueData: {
    name: string;
    address: string;
    city: string;
    postcode: string;
    capacity: number;
    description: string;
  }) => Promise<void>;
  onDeleteVenue: (venueId: string) => Promise<void>;
  onRefresh: () => void;
}

export default function VenuesTab({ venues, onCreateVenue, onDeleteVenue, onRefresh }: VenuesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [capacity, setCapacity] = useState(30);
  const [description, setDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !address || !city || !postcode) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await onCreateVenue({ name, address, city, postcode, capacity, description });
      setName("");
      setAddress("");
      setCity("");
      setPostcode("");
      setCapacity(30);
      setDescription("");
      setShowForm(false);
      toast.success("Venue created successfully");
      onRefresh();
    } catch (error) {
      toast.error("Failed to create venue" + (error instanceof Error ? `: ${error.message}` : ""));
    }
  };

  const handleDeleteClick = (venueId: string) => {
    setVenueToDelete(venueId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!venueToDelete) return;
    try {
      await onDeleteVenue(venueToDelete);
      toast.success("Venue deleted successfully");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete venue" + (error instanceof Error ? `: ${error.message}` : ""));
    } finally {
      setShowDeleteConfirm(false);
      setVenueToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setVenueToDelete(null);
  };

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Venues ({venues.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90"
        >
          <Plus size={18} />
          New Venue
        </button>
      </div>

      {/* Create Venue Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="font-heading text-lg font-bold text-gray-900 mb-4">Create New Venue</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Community Centre" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
              <input type="text" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="Postcode" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input type="number" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90">Create Venue</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Venues List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Postcode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {venues.map((venue) => (
              <tr key={venue.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{venue.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{venue.address}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{venue.city}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{venue.postcode}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{venue.capacity}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDeleteClick(venue.id)}
                    className="inline-flex items-center justify-center p-1 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete venue"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Venue"
        message="Are you sure you want to delete this venue? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
