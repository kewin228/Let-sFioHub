import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaVideo } from 'react-icons/fa';
import { api } from '../services/api';

interface UploadFormData {
  title: string;
  description: string;
  isPublic: boolean;
  category: string;
  tags: string;
}

const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { register, handleSubmit, formState: { errors } } = useForm<UploadFormData>();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!file) {
      alert('Выберите видео файл');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('is_public', data.isPublic.toString());
    formData.append('category', data.category);
    formData.append('tags', JSON.stringify(data.tags.split(',').map(tag => tag.trim())));
    formData.append('file', file);

    try {
      const response = await api.post('/api/v1/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setProgress(percent);
        },
      });
      
      alert('Видео успешно загружено!');
      navigate(`/watch/${response.data.video_id}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке видео');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Загрузить видео</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Поле выбора файла */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="video-upload"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <label htmlFor="video-upload" className="cursor-pointer">
            {preview ? (
              <div className="relative">
                <video
                  src={preview}
                  className="w-full max-w-md mx-auto rounded-lg"
                  controls
                />
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Выбран файл: {file?.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12">
                <FaUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Выберите видео файл</p>
                <p className="text-gray-500 text-sm mb-4">
                  Поддерживаются MP4, AVI, MOV, MKV до 2GB
                </p>
                <button
                  type="button"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Выбрать файл
                </button>
              </div>
            )}
          </label>
        </div>

        {/* Прогресс загрузки */}
        {uploading && (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span>Загрузка...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Заголовок */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Заголовок видео *
          </label>
          <input
            type="text"
            {...register('title', { required: 'Заголовок обязателен' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Введите заголовок"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Расскажите о вашем видео..."
          />
        </div>

        {/* Категория */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Категория
          </label>
          <select
            {...register('category')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Выберите категорию</option>
            <option value="music">Музыка</option>
            <option value="gaming">Игры</option>
            <option value="education">Образование</option>
            <option value="entertainment">Развлечения</option>
            <option value="sports">Спорт</option>
            <option value="tech">Технологии</option>
          </select>
        </div>

        {/* Теги */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Теги (через запятую)
          </label>
          <input
            type="text"
            {...register('tags')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="funny, tutorial, gaming"
          />
        </div>

        {/* Видимость */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            {...register('isPublic')}
            defaultChecked
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
            Сделать видео публичным
          </label>
        </div>

        {/* Кнопки */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={uploading || !file}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <FaVideo />
            <span>{uploading ? 'Загрузка...' : 'Опубликовать'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadPage;