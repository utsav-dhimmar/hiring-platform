import { useEffect, useState } from "react";
/**
 * Hook to debounce a value
 * @param value The value to debounce
 * @param delay The delay in milliseconds to wait before updating the debounced value (default 500 ms)
 * @returns The debounced value
 */
export const useDebouncedValue = <T>(value: T, delay: number = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
};