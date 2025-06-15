import { describe, it, expect } from "vitest";
import { searchOTPs, getSearchStats } from "../search";
import { SearchableOTPItem } from "../search";

describe("search utilities", () => {
  const mockOtps: SearchableOTPItem[] = [
    {
      otp: { Id: "1", Issuer: "GitHub", Label: "user@example.com", Secret: "SECRET1", Period: 30 },
      secret: { Id: "1", CurrentCode: "123456", CurrentExpireAt: "2024-01-01T00:00:30Z", NextCode: "789012", NextExpireAt: "2024-01-01T00:01:00Z" }
    },
    {
      otp: { Id: "2", Issuer: "Google", Label: "test@gmail.com", Secret: "SECRET2", Period: 30 },
      secret: { Id: "2", CurrentCode: "234567", CurrentExpireAt: "2024-01-01T00:00:30Z", NextCode: "890123", NextExpireAt: "2024-01-01T00:01:00Z" }
    },
    {
      otp: { Id: "3", Issuer: "Microsoft", Label: "work@company.com", Secret: "SECRET3", Period: 30 },
      secret: { Id: "3", CurrentCode: "345678", CurrentExpireAt: "2024-01-01T00:00:30Z", NextCode: "901234", NextExpireAt: "2024-01-01T00:01:00Z" }
    },
    {
      otp: { Id: "4", Issuer: "Amazon", Label: "aws@cloud.com", Secret: "SECRET4", Period: 30 },
      secret: { Id: "4", CurrentCode: "456789", CurrentExpireAt: "2024-01-01T00:00:30Z", NextCode: "012345", NextExpireAt: "2024-01-01T00:01:00Z" }
    },
  ];

  describe("searchOTPs", () => {
    it("should return all OTPs when search query is empty", () => {
      const result = searchOTPs(mockOtps, "");
      expect(result).toEqual(mockOtps);
    });

    it("should return all OTPs when search query is only whitespace", () => {
      const result = searchOTPs(mockOtps, "   ");
      expect(result).toEqual(mockOtps);
    });

    it("should filter by issuer (case insensitive)", () => {
      const result = searchOTPs(mockOtps, "github");
      expect(result).toHaveLength(1);
      expect(result[0].otp.Issuer).toBe("GitHub");
    });

    it("should filter by label (case insensitive)", () => {
      const result = searchOTPs(mockOtps, "gmail");
      expect(result).toHaveLength(1);
      expect(result[0].otp.Label).toBe("test@gmail.com");
    });

    it("should filter by partial matches", () => {
      const result = searchOTPs(mockOtps, "goo");
      expect(result).toHaveLength(1);
      expect(result[0].otp.Issuer).toBe("Google");
    });

    it("should support multiple search terms (AND logic)", () => {
      const result = searchOTPs(mockOtps, "microsoft work");
      expect(result).toHaveLength(1);
      expect(result[0].otp.Issuer).toBe("Microsoft");
      expect(result[0].otp.Label).toBe("work@company.com");
    });

    it("should return empty array when no matches found", () => {
      const result = searchOTPs(mockOtps, "nonexistent");
      expect(result).toHaveLength(0);
    });

    it("should handle multiple terms where not all match", () => {
      const result = searchOTPs(mockOtps, "github nonexistent");
      expect(result).toHaveLength(0);
    });

    it("should trim search terms", () => {
      const result = searchOTPs(mockOtps, "  github  ");
      expect(result).toHaveLength(1);
      expect(result[0].otp.Issuer).toBe("GitHub");
    });

    it("should match across both issuer and label for single term", () => {
      const testOtps: SearchableOTPItem[] = [
        {
          otp: { Id: "1", Issuer: "TestService", Label: "user@example.com", Secret: "SECRET1", Period: 30 },
          secret: { Id: "1", CurrentCode: "123456", CurrentExpireAt: "2024-01-01T00:00:30Z", NextCode: "789012", NextExpireAt: "2024-01-01T00:01:00Z" }
        },
        {
          otp: { Id: "2", Issuer: "GitHub", Label: "test@example.com", Secret: "SECRET2", Period: 30 },
          secret: { Id: "2", CurrentCode: "234567", CurrentExpireAt: "2024-01-01T00:00:30Z", NextCode: "890123", NextExpireAt: "2024-01-01T00:01:00Z" }
        },
      ];
      
      const result = searchOTPs(testOtps, "test");
      expect(result).toHaveLength(2); // Should match both TestService and test@example.com
    });
  });

  describe("getSearchStats", () => {
    it("should return correct stats for empty results", () => {
      const stats = getSearchStats(4, 0, "nonexistent");
      expect(stats).toEqual({
        isSearchActive: true,
        hasResults: false,
        showingAll: false,
        totalItems: 4,
        filteredItems: 0,
        query: "nonexistent",
      });
    });

    it("should return correct stats for partial results", () => {
      const stats = getSearchStats(4, 2, "test");
      expect(stats).toEqual({
        isSearchActive: true,
        hasResults: true,
        showingAll: false,
        totalItems: 4,
        filteredItems: 2,
        query: "test",
      });
    });

    it("should return correct stats for all results", () => {
      const stats = getSearchStats(4, 4, "");
      expect(stats).toEqual({
        isSearchActive: false,
        hasResults: true,
        showingAll: true,
        totalItems: 4,
        filteredItems: 4,
        query: "",
      });
    });

    it("should return correct stats for empty data", () => {
      const stats = getSearchStats(0, 0, "");
      expect(stats).toEqual({
        isSearchActive: false,
        hasResults: false,
        showingAll: true,
        totalItems: 0,
        filteredItems: 0,
        query: "",
      });
    });

    it("should handle whitespace-only search query", () => {
      const stats = getSearchStats(4, 4, "   ");
      expect(stats).toEqual({
        isSearchActive: false,
        hasResults: true,
        showingAll: true,
        totalItems: 4,
        filteredItems: 4,
        query: "",
      });
    });
  });
}); 