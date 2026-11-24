"use client";

import { apiFetch } from "@/lib/backend/client";
import type { PostCommentDto, PostWithContentDto } from "@/type/post";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function usePost(id: number) {
  const [post, setPost] = useState<PostWithContentDto | null>(null);

  useEffect(() => {
    apiFetch(`/api/v1/posts/${id}`).then(setPost);
  }, [id]);

  const deletePost = (onSuccess: (data: { msg: string }) => void) => {
    apiFetch(`/api/v1/posts/${id}`, {
      method: "DELETE",
    })
      .then(onSuccess)
      .catch((error) => alert(error.msg ?? "글 삭제에 실패했습니다."));
  };

  return {
    post,
    deletePost,
  };
}

function usePostComments(postId: number) {
  const [postComments, setPostComments] = useState<PostCommentDto[] | null>(
    null,
  );

  useEffect(() => {
    apiFetch(`/api/v1/posts/${postId}/comments`).then(setPostComments);
  }, [postId]);

  const deleteComment = (
    commentId: number,
    onSuccess: (data: { msg: string }) => void,
  ) => {
    apiFetch(`/api/v1/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((data) => {
        setPostComments(
          (prev) => prev?.filter((comment) => comment.id != commentId) ?? null,
        );

        onSuccess(data);
      })
      .catch((error) => alert(error.msg ?? "댓글 삭제에 실패했습니다."));
  };

  const writeComment = (
    content: string,
    onSuccess: (data: { msg: string }) => void,
  ) => {
    apiFetch(`/api/v1/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        content,
      }),
    })
      .then((data) => {
        setPostComments((prev) => (prev == null ? prev : [...prev, data.data]));

        onSuccess(data);
      })
      .catch((error) => alert(error.msg ?? "댓글 작성에 실패했습니다."));
  };

  return {
    postId,
    postComments,
    deleteComment,
    writeComment,
  };
}

function PostInfo({
  postState,
}: {
  postState: ReturnType<typeof usePost>;
}) {
  const router = useRouter();
  const { post, deletePost: _deletePost } = postState;

  if (post == null) return <div>로딩중...</div>;

  const deletePost = () => {
    if (!confirm(`${post.id}번 글을 정말로 삭제하시겠습니까?`)) return;

    _deletePost((data) => {
      alert(data.msg);
      router.replace("/posts");
    });
  };

  return (
    <>
      <div>번호 : {post.id}</div>
      <div>작성일 : {new Date(post.createDate).toLocaleString()}</div>
      <div>수정일 : {new Date(post.modifyDate).toLocaleString()}</div>
      <div>제목 : {post.title}</div>
      <div style={{ whiteSpace: "pre-line" }}>{post.content}</div>

      <div className="flex gap-2">
        <button className="p-2 rounded border" onClick={deletePost}>
          삭제
        </button>
        <Link href={`/posts/${post.id}/edit`} className="p-2 rounded border">
          수정
        </Link>
        <Link href="/posts" className="p-2 rounded border">
          목록
        </Link>
      </div>
    </>
  );
}

function PostCommentWrite({
  postCommentsState,
}: {
  postCommentsState: ReturnType<typeof usePostComments>;
}) {
  const { postId, writeComment } = postCommentsState;

  const handleCommentWriteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const contentTextarea = form.elements.namedItem(
      "content",
    ) as HTMLTextAreaElement;

    contentTextarea.value = contentTextarea.value.trim();

    if (contentTextarea.value.length == 0) {
      alert("댓글 내용을 입력해주세요.");
      contentTextarea.focus();
      return;
    }

    if (contentTextarea.value.length < 2) {
      alert("댓글 내용을 2자 이상 입력해주세요.");
      contentTextarea.focus();
      return;
    }

    writeComment(contentTextarea.value, (data) => {
      alert(data.msg);
      contentTextarea.value = "";
    });
  };

  return (
    <>
      <h2>{postId}번 글에 대한 댓글 작성</h2>

      <form
        className="flex flex-col gap-2 p-2"
        onSubmit={handleCommentWriteSubmit}
      >
        <textarea
          className="border p-2 rounded"
          name="content"
          placeholder="댓글 내용"
          maxLength={100}
          rows={3}
        />
        <button className="border p-2 rounded" type="submit">
          작성
        </button>
      </form>
    </>
  );
}

function PostCommentListItem({
  comment,
  postCommentsState,
}: {
  comment: PostCommentDto;
  postCommentsState: ReturnType<typeof usePostComments>;
}) {
  const [modifyMode, setModifyMode] = useState(false);
  const { deleteComment: _deleteComment } = postCommentsState;

  const toggleModifyMode = () => {
    setModifyMode(!modifyMode);
  };

  const deleteComment = () => {
    if (!confirm(`${comment.id}번 댓글을 정말로 삭제하시겠습니까?`)) return;

    _deleteComment(comment.id, (data) => alert(data.msg));
  };

  const handleCommentModifySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <li className="flex gap-2 items-start">
      <span>{comment.id} :</span>
      {!modifyMode && (
        <span style={{ whiteSpace: "pre-line" }}>{comment.content}</span>
      )}
      {modifyMode && (
        <form
          className="flex gap-2 items-start"
          onSubmit={handleCommentModifySubmit}
        >
          <textarea
            className="border p-2 rounded"
            name="content"
            placeholder="댓글 내용"
            maxLength={100}
            rows={3}
            defaultValue={comment.content}
            autoFocus
          />
          <button className="px-2 rounded border" type="submit">
            저장
          </button>
        </form>
      )}
      <button className="px-2 rounded border" onClick={toggleModifyMode}>
        {modifyMode ? "수정취소" : "수정"}
      </button>
      <button className="px-2 rounded border" onClick={deleteComment}>
        삭제
      </button>
    </li>
  );
}

function PostCommentList({
  postCommentsState,
}: {
  postCommentsState: ReturnType<typeof usePostComments>;
}) {
  const { postId, postComments } = postCommentsState;

  return (
    <>
      <h2>{postId}번 글에 대한 댓글 목록</h2>

      {postComments == null && <div>댓글 로딩중...</div>}

      {postComments != null && postComments.length == 0 && (
        <div>댓글이 없습니다.</div>
      )}

      {postComments != null && postComments.length > 0 && (
        <ul>
          {postComments.map((comment) => (
            <PostCommentListItem
              key={comment.id}
              comment={comment}
              postCommentsState={postCommentsState}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function PostCommentWriteAndList({
  postCommentsState,
}: {
  postCommentsState: ReturnType<typeof usePostComments>;
}) {
  return (
    <>
      <PostCommentWrite postCommentsState={postCommentsState} />

      <hr className="my-2" />

      <PostCommentList postCommentsState={postCommentsState} />
    </>
  );
}

export default function Page() {
  const { id: idStr } = useParams<{ id: string }>();
  const id = Number(idStr);
  const postState = usePost(id);
  const postCommentsState = usePostComments(id);

  return (
    <>
      <h1>글 상세페이지</h1>

      <PostInfo postState={postState} />

      <hr className="my-2" />

      <PostCommentWriteAndList postCommentsState={postCommentsState} />
    </>
  );
}
