"use client";

export default function Page() {
  const posts = [
    { id: 1, title: "제목 1" },
    { id: 2, title: "제목 2" },
  ];

  return (
    <>
      <h1>글 목록</h1>

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            {post.id} : {post.title}
          </li>
        ))}
      </ul>
    </>
  );
}
