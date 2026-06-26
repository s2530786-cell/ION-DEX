import { useState, useEffect } from 'react';

/**
 * @file useTokenSecurity.ts
 * @description Real-time contract "X-Ray" hook using GoPlus Security API.
 * Detects honeypots, hidden taxes, and proxy risks before execution.
 */

export interface SecurityReport {
  isHoneypot: boolean;
  buyTax: string;
  sellTax: string;
  isOpenSource: boolean;
  ownerAddress: string;
  isProxy: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useTokenSecurity = (chainId: string, contractAddress: string) => {
  const [report, setReport] = useState<SecurityReport>({
    isHoneypot: false, buyTax: '0', sellTax: '0', isOpenSource: false, 
    ownerAddress: '', isProxy: false, isLoading: true, error: null
  });

  useEffect(() => {
    if (!contractAddress) return;

    const fetchSecurityInfo = async () => {
      setReport(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        // GoPlus Labs API Integration
        const res = await fetch(`https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${contractAddress}`);
        const data = await res.json();

        if (data.code === 1 && data.result[contractAddress.toLowerCase()]) {
          const info = data.result[contractAddress.toLowerCase()];
          setReport({
            isHoneypot: info.is_honeypot === "1",
            buyTax: (parseFloat(info.buy_tax) * 100).toFixed(1),
            sellTax: (parseFloat(info.sell_tax) * 100).toFixed(1),
            isOpenSource: info.is_open_source === "1",
            ownerAddress: info.owner_address || 'None',
            isProxy: info.is_proxy === "1",
            isLoading: false,
            error: null
          });
        } else {
          throw new Error("No security data found for this token.");
        }
      } catch (err: any) {
        setReport(prev => ({ ...prev, isLoading: false, error: err.message }));
      }
    };

    fetchSecurityInfo();
  }, [chainId, contractAddress]);

  return report;
};
