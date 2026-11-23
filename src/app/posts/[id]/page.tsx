"use client";

import { apiFetch } from "@/lib/backend/client";
import type { PostCommentDto, PostWithContentDto } from "@/type/post";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostWithContentDto | null>(null);
  const [postComments, setPostComments] = useState<PostCommentDto[] | null>(
    null,
  );

  useEffect(() => {
    apiFetch(`/api/v1/posts/${id}`).then(setPost);
    apiFetch(`/api/v1/posts/${id}/comments`).then(setPostComments);
  }, [id]);

  const deletePost = (id: number) => {
    apiFetch(`/api/v1/posts/${id}`, {
      method: "DELETE",
    })
      .then((data) => {
        alert(data.msg);
        router.replace("/posts");
      })
      .catch((error) => alert(error.msg ?? "글 삭제에 실패했습니다."));
  };

  const deleteComment = (commentId: number) => {
    apiFetch(`/api/v1/posts/${id}/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((data) => {
        alert(data.msg);

        setPostComments(
          (prev) => prev?.filter((comment) => comment.id != commentId) ?? null,
        );
      })
      .catch((error) => alert(error.msg ?? "댓글 삭제에 실패했습니다."));
  };

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
  };

  if (post == null) return <div>로딩중...</div>;

  return (
    <>
      <h1>글 상세페이지</h1>

      <div>번호 : {post.id}</div>
      <div>작성일 : {new Date(post.createDate).toLocaleString()}</div>
      <div>수정일 : {new Date(post.modifyDate).toLocaleString()}</div>
      <div>제목 : {post.title}</div>
      <div style={{ whiteSpace: "pre-line" }}>{post.content}</div>

      <div className="flex gap-2">
        <button
          className="p-2 rounded border"
          onClick={() =>
            confirm(`${post.id}번 글을 정말로 삭제하시겠습니까?`) &&
            deletePost(post.id)
          }
        >
          삭제
        </button>
        <Link href={`/posts/${post.id}/edit`} className="p-2 rounded border">
          수정
        </Link>
        <Link href="/posts" className="p-2 rounded border">
          목록
        </Link>
      </div>

      <h2>댓글 작성</h2>

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

      <h2>댓글 목록</h2>

      {postComments == null && <div>댓글 로딩중...</div>}

      {postComments != null && postComments.length == 0 && (
        <div>댓글이 없습니다.</div>
      )}

      {postComments != null && postComments.length > 0 && (
        <ul>
          {postComments.map((comment) => (
            <li key={comment.id} className="flex gap-2 items-start">
              <span style={{ whiteSpace: "pre-line" }}>
                {comment.id} : {comment.content}
              </span>
              <button
                className="px-2 rounded border"
                onClick={() =>
                  confirm(`${comment.id}번 댓글을 정말로 삭제하시겠습니까?`) &&
                  deleteComment(comment.id)
                }
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
