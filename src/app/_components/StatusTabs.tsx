"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import LoadingSpinner from "./LoadingSpinner";
import { ArticleCard } from "./ArticleCard";
import Pagination from "./Pagination";

interface Article {
  id: string;
  url: string;
  memo: string | null;
  status: string;
}

const tabs = [
  { id: "WANT_TO_READ", label: "未読" },
  { id: "IN_PROGRESS", label: "読書中" },
  { id: "COMPLETED", label: "読了" },
  { id: "ALL", label: "全記事" },
] as const;

type TabId = (typeof tabs)[number]["id"];
type ArticleStatus = "WANT_TO_READ" | "IN_PROGRESS" | "COMPLETED";

const StatusTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("WANT_TO_READ");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 1ページあたり6件表示（2列×3行）

  const utils = api.useContext();

  const { data: articles = [], isLoading } =
    api.article.getArticlesByStatus.useQuery(
      { status: activeTab },
      {
        retry: false,
      },
    );

  // ページネーション用の記事配列を取得
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return articles.slice(startIndex, endIndex);
  };

  // 総ページ数を計算
  const totalPages = Math.ceil(articles.length / itemsPerPage);

  // タブ切り替え時にページをリセット
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { mutate: updateArticle } = api.article.update.useMutation({
    onSuccess: async () => {
      try {
        await utils.article.getArticlesByStatus.invalidate();
      } catch (error) {
        console.error("Failed to invalidate query:", error);
      }
    },
  });

  const { mutate: deleteArticle } = api.article.delete.useMutation({
    onSuccess: async () => {
      try {
        await utils.article.getArticlesByStatus.invalidate();
      } catch (error) {
        console.error("Failed to invalidate query:", error);
      }
    },
  });

  const handleSave = async (
    id: string,
    memo: string,
    status: ArticleStatus,
  ): Promise<void> => {
    try {
      await new Promise<void>((resolve) => {
        updateArticle(
          {
            id,
            memo,
            status,
          },
          {
            onSuccess: () => resolve(),
          },
        );
      });
    } catch (error) {
      console.error("Failed to update article:", error);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await new Promise<void>((resolve) => {
        deleteArticle(
          { id },
          {
            onSuccess: () => resolve(),
          },
        );
      });
    } catch (error) {
      console.error("Failed to delete article:", error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner message="読み込み中..." />;
    }

    if (articles.length === 0) {
      return (
        <div className="text-center text-xl font-medium text-gray-900">
          {activeTab === "WANT_TO_READ" && "未読の記事がありません"}
          {activeTab === "IN_PROGRESS" && "読書中の記事がありません"}
          {activeTab === "COMPLETED" && "読了した記事がありません"}
          {activeTab === "ALL" && "記事がありません"}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-6">
          {getCurrentPageItems().map((article: Article) => (
            <div key={article.id} className="w-full">
              <ArticleCard
                id={article.id}
                url={article.url}
                title={article.url}
                description={article.memo ?? ""}
                status={article.status as ArticleStatus}
                memo={article.memo ?? ""}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
        {articles.length > itemsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="fixed top-40 left-0 right-0 flex flex-col items-center space-y-4 z-30 h-[calc(100vh-160px)]">
      <div className="relative flex flex-wrap justify-center gap-4 rounded-full bg-gray-100 p-3 shadow-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`relative rounded-full px-8 py-3 text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-lg shadow-pink-500/40 hover:scale-110"
                : "bg-white text-gray-600 hover:text-gray-900 hover:shadow-lg hover:shadow-gray-500/30"
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-[1440px] rounded-3xl bg-white p-8 shadow-md overflow-y-auto flex-1 mx-4">
        <div className="animate-fadeSlideIn transition-opacity duration-500">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default StatusTabs;