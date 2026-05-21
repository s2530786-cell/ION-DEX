import React, { useEffect, useState } from 'react';
import { reverseResolve, resolveDomain, formatAddress, isIonDomain, isIonAddress } from '../../utils/ionDomain';

interface DomainBadgeProps {
  address?: string;
  domain?: string;
  className?: string;
  /** If true, attempt reverse-resolve the address to a .ion domain */
  showDomain?: boolean;
}

/**
 * DomainBadge — resolves and displays .ion domains
 * 
 * When given an address, attempts reverse resolution to show the .ion name.
 * Falls back to truncated hex if no domain found.
 * Shows a 🔗 icon when a .ion domain is resolved.
 */
export function DomainBadge({ address, domain, className, showDomain = true }: DomainBadgeProps) {
  const [resolvedDomain, setResolvedDomain] = useState<string | null>(domain || null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (domain) {
      // Forward resolve domain → address for verification
      setResolvedDomain(domain);
      setLoading(true);
      resolveDomain(domain).then(addr => {
        setResolvedAddress(addr);
        setLoading(false);
      });
      return;
    }

    if (address && showDomain && isIonAddress(address)) {
      setLoading(true);
      reverseResolve(address).then(d => {
        setResolvedDomain(d);
        setLoading(false);
      });
      return;
    }

    setLoading(false);
  }, [address, domain, showDomain]);

  const display = resolvedDomain || formatAddress(address || '', null);
  const hasDomain = !!resolvedDomain;

  return (
    <span className={`domain-badge ${hasDomain ? 'has-domain' : ''} ${className || ''}`}>
      {hasDomain && <span className="domain-icon" title="ION Domain verified">🔗</span>}
      <span className="domain-text" title={address || domain}>
        {loading ? '⟳' : display}
      </span>
      {hasDomain && resolvedAddress && (
        <span className="domain-verified" title={resolvedAddress}>✓</span>
      )}
    </span>
  );
}

/**
 * AddressInput — input field that accepts both .ion domains and raw addresses
 * Automatically resolves .ion domains to addresses on blur/submit
 */
export function useAddressResolver() {
  const [raw, setRaw] = useState('');
  const [resolved, setResolved] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = async (input: string) => {
    setError(null);
    if (!input.trim()) {
      setResolved(null);
      return;
    }
    if (isIonDomain(input)) {
      setResolving(true);
      const addr = await resolveDomain(input.trim());
      if (addr) {
        setResolved(addr);
        setResolving(false);
      } else {
        setError(`Cannot resolve ${input}`);
        setResolved(null);
        setResolving(false);
      }
    } else {
      setResolved(input.trim());
    }
  };

  return { raw, setRaw, resolved, resolving, error, resolve, setError };
}
