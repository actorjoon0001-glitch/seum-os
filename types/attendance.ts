/**
 * 세움OS 근태관리 타입 정의
 * DB: public.attendance (supabase/migrations/014_attendance.sql)
 */

/** 근무 상태 값. DB 저장용 문자열 union. */
export type AttendanceStatus =
  | 'before'        // 출근전
  | 'working'       // 근무중
  | 'finished'      // 퇴근완료
  | 'late'          // 지각
  | 'absent'        // 결근
  | 'outside'       // 외근
  | 'business_trip' // 출장
  | 'vacation'      // 휴가
  | 'sick';         // 병가

/** 근무 형태(확장 여지). */
export type AttendanceWorkType =
  | 'office'   // 사무실 근무
  | 'remote'   // 재택
  | 'field'    // 현장
  | 'mixed';   // 혼합

/** 소속 전시장 ID (기존 시스템과 동일). */
export type ShowroomId =
  | 'headquarters'
  | 'showroom1'
  | 'showroom3'
  | 'showroom4'
  | 'ganghwa';

/** 팀 구분 (기존 employees.team 과 동일한 한글 문자열). */
export type TeamName =
  | '영업'
  | '설계'
  | '시공'
  | '마케팅'
  | '정산'
  | '경영';

/** ISO 8601 timestamptz 문자열. 예: '2026-04-17T09:02:00+09:00'. */
export type IsoTimestamp = string;

/** 'YYYY-MM-DD' 형식의 date 문자열. */
export type IsoDate = string;

/**
 * public.attendance 테이블 행과 1:1 매핑되는 타입.
 * null 허용 컬럼은 null 표기.
 */
export interface AttendanceRow {
  id: string;                     // uuid PK
  local_id: string | null;        // 앱 생성 업서트 키 (att_<userId>_<YYYY-MM-DD>)
  user_id: string | null;         // auth.users.id (uuid)
  employee_id: number | null;     // public.employees.id (bigint)
  user_name: string | null;
  team: TeamName | string | null;
  showroom: ShowroomId | string | null;
  date: IsoDate;                  // NOT NULL
  check_in: IsoTimestamp | null;
  check_out: IsoTimestamp | null;
  status: AttendanceStatus;       // default 'before'
  work_type: AttendanceWorkType | string | null;
  note: string | null;
  is_late: boolean;               // default false
  work_minutes: number | null;    // 근무시간(분)
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  created_by: string | null;      // auth user id
  updated_by: string | null;      // auth user id
}

/** INSERT 페이로드 (DB 기본값/트리거로 채워지는 필드는 생략 가능). */
export type AttendanceInsert = {
  local_id?: string | null;
  user_id?: string | null;
  employee_id?: number | null;
  user_name?: string | null;
  team?: TeamName | string | null;
  showroom?: ShowroomId | string | null;
  date: IsoDate;
  check_in?: IsoTimestamp | null;
  check_out?: IsoTimestamp | null;
  status?: AttendanceStatus;
  work_type?: AttendanceWorkType | string | null;
  note?: string | null;
  is_late?: boolean;
  work_minutes?: number | null;
  created_by?: string | null;
  updated_by?: string | null;
};

/** UPDATE 페이로드 (모든 필드 선택적, date는 수정 불가 권장). */
export type AttendanceUpdate = Partial<Omit<AttendanceInsert, 'date'>> & {
  date?: IsoDate;
};

/** 관리자 조회 필터. */
export interface AttendanceQueryFilter {
  dateFrom?: IsoDate;
  dateTo?: IsoDate;
  date?: IsoDate;
  year?: number;
  month?: number;                 // 1~12
  userId?: string;                // auth.users.id
  userName?: string;              // 부분 일치
  team?: TeamName | string;
  showroom?: ShowroomId | string;
  status?: AttendanceStatus;
}

/** KPI 집계용 월간 요약. */
export interface AttendanceMonthlyStats {
  userId: string;
  userName: string;
  team: TeamName | string | null;
  year: number;
  month: number;
  presentDays: number;            // 정상 출근 일수 (지각 제외)
  lateDays: number;               // 지각 횟수
  absentDays: number;             // 결근 횟수
  vacationDays: number;
  outsideDays: number;
  businessTripDays: number;
  sickDays: number;
  totalWorkMinutes: number;       // 총 근무시간(분)
  attendanceRate: number;         // 0~1 (출근율)
}

/** 출퇴근 액션 결과(에러 타입은 union 으로 고정). */
export type AttendanceActionResult =
  | { ok: true; record: AttendanceRow; hadJournal?: boolean }
  | {
      ok: false;
      reason:
        | 'already_checked_in'
        | 'already_checked_out'
        | 'no_check_in'
        | 'journal_required'
        | 'journal_warning'
        | 'invalid_status'
        | 'unauthorized'
        | 'network_error';
      record?: AttendanceRow;
    };
