import {
  createSignal,
  onMount,
  onCleanup,
  JSX,
  ParentComponent,
} from "solid-js";
import { Flex } from "../../components/Flex";
import { IoReloadCircleSharp } from "solid-icons/io";
import styles from "./PullToReload.module.css";

type PullToRefreshProps = {
  onRefresh?: () => Promise<void>;
  children: JSX.Element;
  pullThreshold?: number;
  maxPull?: number;
};

export const PullToRefresh: ParentComponent<PullToRefreshProps> = (props) => {
  const [isRefreshing, setIsRefreshing] = createSignal(false);
  const [pullDistance, setPullDistance] = createSignal(0);
  const [startY, setStartY] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);

  let containerRef: HTMLDivElement | undefined;
  const PULL_THRESHOLD = props.pullThreshold ?? 59; // Distance needed to trigger refresh
  const MAX_PULL = props.maxPull ?? 60; // Maximum pull distance for visual feedback

  const handleTouchStart = (e: TouchEvent): void => {
    if (containerRef && containerRef.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: TouchEvent): void => {
    if (!isDragging() || !containerRef || containerRef.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY();

    if (diff > 0) {
      e.preventDefault(); // Prevent default scroll behavior
      const pullDist = Math.min(diff * 0.5, MAX_PULL); // Damping effect
      setPullDistance(pullDist);
    }
  };

  const handleTouchEnd = async (): Promise<void> => {
    if (!isDragging()) return;

    setIsDragging(false);

    if (pullDistance() >= PULL_THRESHOLD && !isRefreshing()) {
      setIsRefreshing(true);

      try {
        // Call the refresh function passed as prop
        if (props.onRefresh) {
          await props.onRefresh();
        }
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: MouseEvent): void => {
    if (containerRef && containerRef.scrollTop === 0) {
      setStartY(e.clientY);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isDragging() || !containerRef || containerRef.scrollTop > 0) return;

    const diff = e.clientY - startY();
    if (diff > 0) {
      e.preventDefault();
      const pullDist = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(pullDist);
    }
  };

  const handleMouseUp = (): void => {
    handleTouchEnd();
  };

  onMount(() => {
    const container = containerRef;
    if (!container) return;

    // Touch events
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Mouse events for desktop
    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    onCleanup(() => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    });
  });

  const getRefreshIndicatorStyle = (): JSX.CSSProperties => {
    const distance = pullDistance();
    const opacity = Math.min(distance / PULL_THRESHOLD, 1);
    const scale = Math.min((distance / PULL_THRESHOLD) * 0.8 + 0.2, 1);

    return {
      transform: `translateY(${distance - 50}px) scale(${scale})`,
      opacity: opacity,
      transition: isDragging() ? "none" : "all 0.3s ease-out",
    };
  };

  const getContainerStyle = (): JSX.CSSProperties => ({
    transform: `translateY(${pullDistance()}px)`,
    transition: isDragging() ? "none" : "transform 0.3s ease-out",
  });

  return (
    <div style={{ position: "relative", overflow: "hidden", height: "100%" }}>
      {/* Refresh Indicator */}
      <Flex
        AlignItems="center"
        Direction="row"
        JustifyContent="center"
        Style={{
          position: "absolute",
          height: "40px",
          ...getRefreshIndicatorStyle(),
        }}
        Width="100%"
      >
        <IoReloadCircleSharp
          classList={{
            [styles.reload_icon]: true,
            [styles.spinning]: isRefreshing(),
          }}
          style={{
            transform: `rotate(${pullDistance() * 10}deg)`,
          }}
        />
      </Flex>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        style={{
          height: "100%",
          "overflow-y": "auto",
          "-webkit-overflow-scrolling": "touch",
          ...getContainerStyle(),
        }}
      >
        {props.children}
      </div>
    </div>
  );
};
