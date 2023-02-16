import { useEffect, useRef } from "react";

function usePrevValue<T>(value: T): T | undefined {
  const prevValueRef = useRef<any>()

  useEffect(() => {
    prevValueRef.current = value
  })

  return prevValueRef.current
}

export default usePrevValue