import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';

const baseURL = import.meta.env.VITE_ECHOMAP_API_URL;

export const CommentsSection = ({ memoryId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${baseURL}/api/comments/memory/${memoryId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setComments(result.data);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [memoryId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${baseURL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memoryId,
          content: newComment
        })
      });

      const result = await response.json();
      if (result.success) {
        // Add the new comment to the list
        const newCommentObj = {
          id: result.data.id,
          memoryId,
          userId: user.id,
          username: user.username,
          profilePicture: user.profilePicture,
          content: newComment,
          createdAt: new Date().toISOString()
        };
        setComments(prevComments => [newCommentObj, ...prevComments]);
        setNewComment('');
        addNotification('Comment added successfully', 'success');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      addNotification('Failed to add comment', 'error');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto px-4">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.profilePicture || '/iconLOGO.png'}
                  alt={comment.username}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <p className="font-semibold text-sm">{comment.username}</p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmitComment} className="flex items-center space-x-2">
          <img
            src={user.profilePicture || '/iconLOGO.png'}
            alt={user.username}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="text-blue-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

CommentsSection.propTypes = {
  memoryId: PropTypes.string.isRequired
};
