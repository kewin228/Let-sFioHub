import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FaEye, FaThumbsUp, FaThumbsDown, FaShare, FaSave, FaComment } from 'react-icons/fa';
import { api } from '../services/api';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_path: string;
  views: number;
  likes: number;
  dislikes: number;
  duration: number;
  created_at: string;
  uploader: {
    id: number;
    username: string;
    display_name: string;
    avatar: string;
    subscriber_count: number;
  };
}

interface Comment {
  id: number;
  text: string;
  likes: number;
  created_at: string;
  author: {
    username: string;
    display_name: string;
    avatar: string;
  };
}

const WatchPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
      fetchComments();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const response = await api.get(`/api/v1/videos/${videoId}`);
      setVideo(response.data);
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/api/v1/videos/${videoId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!video) return;
    try {
      // Здесь будет API для лайков
      setVideo({ ...video, likes: video.likes + 1 });
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !videoId) return;

    try {
      const response = await api.post(`/api/v1/videos/${videoId}/comments`, {
        text: commentText
      });
      setComments([response.data, ...comments]);
      setCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!video) return;
    try {
      await api.post(`/api/v1/users/${video.uploader.username}/subscribe`);
      setIsSubscribed(true);
      // Обновляем счетчик подписчиков
      setVideo({
        ...video,
        uploader: {
          ...video.uploader,
          subscriber_count: video.uploader.subscriber_count + 1
        }
      });
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Видео не найдено</h2>
        <p className="text-gray-600">Возможно, видео было удалено или вы ввели неверный URL</p>
      </div>
    );
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)} млн просмотров`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)} тыс. просмотров`;
    }
    return `${views} просмотров`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Видеоплеер */}
      <div className="mb-8">
        <div className="bg-black rounded-lg overflow-hidden">
          <ReactPlayer
            url={`http://localhost:8000/api/v1/videos/${videoId}/watch`}
            controls
            width="100%"
            height="600px"
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Информация о видео */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка - основная информация */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
          
          <div className="flex flex-wrap items-center justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-gray-600">{formatViews(video.views)}</span>
              <span className="text-gray-600">
                {format(new Date(video.created_at), 'd MMMM yyyy', { locale: ru })}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <FaThumbsUp />
                <span>{video.likes}</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                <FaThumbsDown />
                <span>{video.dislikes}</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                <FaShare />
                <span>Поделиться</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                <FaSave />
                <span>Сохранить</span>
              </button>
            </div>
          </div>

          {/* Описание видео */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600">
                    {video.uploader.display_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold">{video.uploader.display_name || video.uploader.username}</h3>
                  <p className="text-sm text-gray-600">
                    {video.uploader.subscriber_count} подписчиков
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSubscribe}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isSubscribed
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isSubscribed ? 'Вы подписаны' : 'Подписаться'}
              </button>
            </div>
            
            <div className="mt-4">
              <p className="whitespace-pre-line">{video.description}</p>
            </div>
          </div>

          {/* Комментарии */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <FaComment />
              <h2 className="text-xl font-bold">Комментарии</h2>
              <span className="text-gray-600">({comments.length})</span>
            </div>

            {/* Форма для комментария */}
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Добавьте комментарий..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                rows={3}
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!commentText.trim()}
              >
                Отправить
              </button>
            </form>

            {/* Список комментариев */}
            <div className="space-y-6">
              {comments.map(comment => (
                <div key={comment.id} className="border-b pb-6">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="font-bold text-gray-600">
                          {comment.author.display_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-bold">{comment.author.display_name || comment.author.username}</h4>
                        <span className="text-sm text-gray-500">
                          {format(new Date(comment.created_at), 'd MMMM yyyy', { locale: ru })}
                        </span>
                      </div>
                      <p className="mb-3">{comment.text}</p>
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                          <FaThumbsUp className="w-4 h-4" />
                          <span>{comment.likes}</span>
                        </button>
                        <button className="text-gray-600 hover:text-blue-600">
                          Ответить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaComment className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Комментариев пока нет. Будьте первым!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Правая колонка - рекомендации */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-bold mb-4">Рекомендуемые видео</h3>
          <div className="space-y-4">
            {/* Здесь будут карточки рекомендуемых видео */}
            <div className="text-center py-8 text-gray-500">
              <p>Рекомендации появятся после просмотра нескольких видео</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;