import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FaEye, FaThumbsUp } from 'react-icons/fa';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail_path: string;
    views: number;
    likes: number;
    created_at: string;
    uploader: {
      username: string;
      display_name: string;
    };
  };
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <Link to={`/watch/${video.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg mb-2">
        <img
          src={`http://localhost:8000${video.thumbnail_path}`}
          alt={video.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
          {video.duration ? 
            `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` 
            : '--:--'
          }
        </div>
      </div>
      
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-semibold">
              {video.uploader.display_name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600">
            {video.title}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {video.uploader.display_name || video.uploader.username}
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            <span className="flex items-center space-x-1">
              <FaEye className="w-3 h-3" />
              <span>{formatViews(video.views)} просмотров</span>
            </span>
            <span className="flex items-center space-x-1">
              <FaThumbsUp className="w-3 h-3" />
              <span>{formatViews(video.likes)}</span>
            </span>
            <span>
              {formatDistanceToNow(new Date(video.created_at), {
                addSuffix: true,
                locale: ru
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;