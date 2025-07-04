import React, { useState } from 'react';
import ForumLeftContent from './components/ForumLeftContent';
import ForumEntries from './components/ForumEntries';
import ForumRightContent from './components/ForumRightContent';
import CreatePostModal from './components/CreatePostModal';

const Forum = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular'); // 'popular', 'newest', 'following'

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="w-full lg:w-64 xl:w-72">
          <ForumLeftContent 
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button 
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg border transition-colors
                  ${sortBy === 'popular'
                    ? 'bg-white border-blue-200 text-blue-600'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
              >
                Popular
              </button>
              <button 
                onClick={() => setSortBy('newest')}
                className={`px-4 py-2 rounded-lg border transition-colors
                  ${sortBy === 'newest'
                    ? 'bg-white border-blue-200 text-blue-600'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
              >
                Newest
              </button>
              <button 
                onClick={() => setSortBy('following')}
                className={`px-4 py-2 rounded-lg border transition-colors
                  ${sortBy === 'following'
                    ? 'bg-white border-blue-200 text-blue-600'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
              >
                Following
              </button>
            </div>

            {/* Create Post Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors duration-200 flex items-center gap-2"
            >
              <span>✏️</span>
              <span>새 글 작성</span>
            </button>
          </div>

          {/* Forum Entries */}
          <ForumEntries 
            category={selectedCategory}
            sortBy={sortBy}
          />
        </div>

        {/* Right Sidebar */}
        <div className="hidden xl:block w-72 2xl:w-80">
          <ForumRightContent />
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Forum; 