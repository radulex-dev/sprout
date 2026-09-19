'use client';

import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { DateFormatter, getLocalTimeZone, getWeeksInMonth, isSameDay, isSameMonth, isToday, parseDate, startOfMonth, startOfWeek, type CalendarDate } from '@internationalized/date';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { range } from 'lodash-es';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

// Constants
import { DATE_SELECT_COLLISION_AVOIDANCE, DATE_SELECT_COLLISION_PADDING, DATE_SELECT_SIDE_OFFSET, DAY_LABEL_FORMAT, DAYS_IN_WEEK, DEFAULT_LOCALE, MONTH_TITLE_FORMAT, NEXT_MONTH_LABEL, NEXT_MONTH_STEP, PREVIOUS_MONTH_LABEL, PREVIOUS_MONTH_STEP, SELECT_DATE_TEXT, WEEKDAY_FORMAT } from './constants';
import { ButtonVariant } from '@/design-system/Button/constants';

// Components
import Button from '@/design-system/Button';

// Styles
import styles from './styles.module.css';

export interface Props extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onSelect'> {
    label: string;
    value: string;
    max?: string;
    onSelect: (value: string) => void;
}

const DateSelect: React.FunctionComponent<Props> = ({ label, value, max, onSelect, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const [isOpen, setIsOpen] = useState(false);
    const [month, setMonth] = useState(() => {
        return startOfMonth(parseDate(value));
    });

    const timeZone = getLocalTimeZone();
    const locale = useMemo(() => {
        if (typeof navigator === 'undefined' || !navigator.language) {
            return DEFAULT_LOCALE;
        }

        return navigator.language;
    }, []);
    const selectedDate = useMemo(() => {
        return parseDate(value);
    }, [value]);
    const maxDate = useMemo(() => {
        return max ? parseDate(max) : undefined;
    }, [max]);
    const monthFormatter = useMemo(() => {
        return new DateFormatter(locale, MONTH_TITLE_FORMAT);
    }, [locale]);
    const weekdayFormatter = useMemo(() => {
        return new DateFormatter(locale, WEEKDAY_FORMAT);
    }, [locale]);
    const dayFormatter = useMemo(() => {
        return new DateFormatter(locale, DAY_LABEL_FORMAT);
    }, [locale]);

    const monthTitle = useMemo(() => {
        return monthFormatter.format(month.toDate(timeZone));
    }, [month, monthFormatter, timeZone]);

    const calendarDays = useMemo(() => {
        const first = startOfWeek(startOfMonth(month), locale);
        const weeks = getWeeksInMonth(month, locale);

        return range(weeks * DAYS_IN_WEEK).map((offset) => {
            return first.add({
                days: offset
            });
        });
    }, [locale, month]);

    const handleOpenChange = useCallback((willOpen: boolean) => {
        setIsOpen(willOpen);

        if (willOpen) {
            setMonth(startOfMonth(parseDate(value)));
        }
    }, [value]);

    const handlePreviousMonth = useCallback(() => {
        setMonth((current) => {
            return current.add(PREVIOUS_MONTH_STEP);
        });
    }, []);

    const handleNextMonth = useCallback(() => {
        setMonth((current) => {
            return current.add(NEXT_MONTH_STEP);
        });
    }, []);

    const handleSelectDay = useCallback((day: CalendarDate) => {
        return () => {
            onSelect(day.toString());
            setIsOpen(false);
        };
    }, [onSelect]);

    const isDisabled = (day: CalendarDate): boolean => {
        return maxDate !== undefined && day.compare(maxDate) > 0;
    };

    const renderDay = (day: CalendarDate) => {
        if (!isSameMonth(day, month)) {
            return <span key={day.toString()} className={styles.blank} aria-hidden />;
        }

        const isSelected = isSameDay(day, selectedDate);
        const isDayToday = isToday(day, timeZone);
        const dayClasses = classNames(styles.day, {
            [styles.selected]: isSelected,
            [styles.today]: isDayToday
        });

        return (
            <Button key={day.toString()} variant={ButtonVariant.Unstyled} className={dayClasses} disabled={isDisabled(day)} aria-current={isDayToday ? 'date' : undefined} aria-label={dayFormatter.format(day.toDate(timeZone))} onClick={handleSelectDay(day)}>
                {day.day}
            </Button>
        );
    };

    return (
        <div className={classes} {...props}>
            <BasePopover.Root open={isOpen} onOpenChange={handleOpenChange}>
                <BasePopover.Trigger render={<Button variant={ButtonVariant.Soft} round icon={CalendarDays} aria-label={`${label}: ${SELECT_DATE_TEXT}`} />} />
                <BasePopover.Portal>
                    <BasePopover.Positioner className={styles.positioner} sideOffset={DATE_SELECT_SIDE_OFFSET} align="start" collisionPadding={DATE_SELECT_COLLISION_PADDING} collisionAvoidance={DATE_SELECT_COLLISION_AVOIDANCE}>
                        <BasePopover.Popup className={styles.popup} aria-label={label}>
                            <div className={styles.header}>
                                <Button variant={ButtonVariant.Unstyled} className={styles.nav} onClick={handlePreviousMonth} aria-label={PREVIOUS_MONTH_LABEL}>
                                    <ChevronLeft size="1rem" aria-hidden />
                                </Button>
                                <div className={styles.month}>
                                    {monthTitle}
                                </div>
                                <Button variant={ButtonVariant.Unstyled} className={styles.nav} onClick={handleNextMonth} aria-label={NEXT_MONTH_LABEL}>
                                    <ChevronRight size="1rem" aria-hidden />
                                </Button>
                            </div>
                            <div className={styles.weekdays}>
                                {calendarDays.slice(0, DAYS_IN_WEEK).map((day) => {
                                    return (
                                        <div key={day.toString()} className={styles.weekday}>
                                            {weekdayFormatter.format(day.toDate(timeZone))}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={styles.grid}>
                                {calendarDays.map((day) => {
                                    return renderDay(day);
                                })}
                            </div>
                        </BasePopover.Popup>
                    </BasePopover.Positioner>
                </BasePopover.Portal>
            </BasePopover.Root>
        </div>
    );
};

export default DateSelect;
