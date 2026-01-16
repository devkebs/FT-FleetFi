import React, { useEffect, useState } from 'react';
import { Vehicle } from '../types';
import apiService from '../services/api';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await apiService.getVehicles();
        setVehicles(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load vehicles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading vehicles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
        <p className="text-gray-600 mt-2">Manage your fleet vehicles</p>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600">No vehicles found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {vehicle.vehicle_type}
                  </h3>
                  <p className="text-sm text-gray-600">{vehicle.registration_number}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    vehicle.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : vehicle.status === 'in_operation'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {vehicle.status}
                </span>
              </div>

              <div className="space-y-2">
                {vehicle.current_location && (
                  <div className="text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 text-gray-900">{vehicle.current_location}</span>
                  </div>
                )}
                {vehicle.battery_level !== undefined && (
                  <div className="text-sm">
                    <span className="text-gray-600">Battery:</span>
                    <span className="ml-2 text-gray-900">{vehicle.battery_level}%</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vehicles;
