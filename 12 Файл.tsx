import React, { useEffect, useState } from 'react';
import VideoCard from '../components/VideoCard';
import { api } from '../services/api';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_path: string;
  views: number;
  likes: number;
  created_at: string;
  uploader: {
    username: string;
    display_name: string;
    avatar: string;
  };
}

const HomePage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await api.get('/videos');
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Рекомендуемые видео</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      
      {videos.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Видео не найдены</h3>
          <p className="text-gray-600">Будьте первым, кто загрузит видео!</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;